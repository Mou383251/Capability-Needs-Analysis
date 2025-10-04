import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-300 dark:border-gray-700 pb-2">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-2">
            {children}
        </div>
    </div>
);

export const CnaOverview: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Section title="What is a Capability Needs Analysis (CNA)?">
                <p>
                    A Capability Needs Analysis (CNA) is a systematic process to determine the gap between an organization's current workforce capabilities and the capabilities it needs to achieve its strategic objectives. It is a critical diagnostic tool for effective Human Resource Development (HRD) and Learning & Development (L&D) planning.
                </p>
                <p>
                    Instead of guessing what training is needed, a CNA provides evidence-based insights into specific skill and knowledge gaps at individual, team, and organizational levels.
                </p>
            </Section>
            <Section title="Purpose & Benefits of a CNA">
                <p>The primary purpose of a CNA is to align workforce development with strategic goals. The key benefits include:</p>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Strategic Alignment:</strong> Ensures training investments directly support the organization's corporate plan and priorities.</li>
                    <li><strong>Targeted Investment:</strong> Optimizes the L&D budget by focusing on the most critical skill gaps, maximizing return on investment.</li>
                    <li><strong>Improved Performance:</strong> Addresses specific weaknesses that hinder individual and organizational performance, leading to improved service delivery.</li>
                    <li><strong>Employee Engagement:</strong> Demonstrates a commitment to staff development, which can improve morale, motivation, and retention.</li>
                    <li><strong>Succession Planning:</strong> Identifies skill gaps in potential future leaders, allowing for targeted development to build a strong talent pipeline.</li>
                </ul>
            </Section>
        </div>
    );
};