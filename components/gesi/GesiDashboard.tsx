import React from 'react';
import { ChartComponent } from '../charts';

const Checklist: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
    <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
        <ul className="space-y-2">
            {items.map((item, index) => (
                <li key={index} className="flex items-center">
                    <input id={`check-${title}-${index}`} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                    <label htmlFor={`check-${title}-${index}`} className="ml-3 block text-sm text-gray-700 dark:text-gray-300">{item}</label>
                </li>
            ))}
        </ul>
    </div>
);

export const GesiDashboard: React.FC = () => {
    // Mock data for charts
    const genderDistData = {
        labels: ['Male', 'Female'],
        datasets: [{
            label: 'Gender Distribution',
            data: [58, 42], // Example data
            backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(236, 72, 153, 0.7)'],
        }]
    };

    const inclusionStatsData = {
        labels: ['Persons with Disability', 'Known HIV Status', 'Vulnerable Youth'],
        datasets: [{
            label: 'Inclusion Statistics (Count)',
            data: [12, 8, 25], // Example data
            backgroundColor: 'rgba(217, 119, 6, 0.7)',
        }]
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gender Distribution (Sample)</h3>
                    <ChartComponent type="doughnut" data={genderDistData} />
                </div>
                 <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inclusion Statistics (Sample)</h3>
                    <ChartComponent type="bar" data={inclusionStatsData} />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <Checklist 
                        title="GESI Compliance Checklist"
                        items={[
                            "GESI Action Plan developed and approved.",
                            "Budget allocated for GESI activities.",
                            "GESI Focal Point is active.",
                            "HR Policies reviewed for GESI compliance.",
                            "Staff have completed GESI induction training."
                        ]}
                    />
                </div>
                 <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <Checklist 
                        title="GESI Reporting Checklist"
                        items={[
                            "Sex-disaggregated data is collected for all programs.",
                            "Quarterly GESI progress report submitted to DPM.",
                            "Annual GESI report included in Corporate Plan review.",
                            "Disability access audit conducted.",
                            "GESI achievements are publicly communicated."
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};