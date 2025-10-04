import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-300 dark:border-gray-700 pb-2">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-2">
            {children}
        </div>
    </div>
);

export const CnaAnalysisGuide: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Section title="Interpreting the Data">
                <p>Once you import your data, this system automates the analysis. Here's a guide to interpreting the key metrics you'll see in the dashboards and reports:</p>
                <ul className="list-disc list-inside">
                    <li><strong>Average Capability Score:</strong> The mean score for a specific skill or across an entire division. A low average indicates a widespread development need.</li>
                    <li><strong>Gap Score & Percentage:</strong> The difference between the desired score (10) and the current score. This is the most direct measure of a training need. A higher gap score indicates a more urgent need.</li>
                    <li><strong>Gap Category:</strong> We classify gaps to help with prioritization:
                        <ul>
                            <li><strong>Minor Gap (Score 8-9):</strong> Requires minor upskilling, coaching, or on-the-job practice.</li>
                            <li><strong>Moderate Gap (Score 5-7):</strong> Requires structured development like mentoring or targeted workshops.</li>
                            <li><strong>Critical Gap (Score 1-4):</strong> Requires immediate and formal training intervention.</li>
                        </ul>
                    </li>
                    <li><strong>Frequency of Gaps:</strong> A chart on the main dashboard shows which gaps appear most frequently across the organization. These are prime candidates for group training programs.</li>
                </ul>
            </Section>
            <Section title="Common Pitfalls to Avoid">
                <ul className="list-disc list-inside">
                    <li><strong>Ignoring Qualitative Data:</strong> Don't just look at the numbers. The text responses in fields like 'Training Preferences' or 'Priorities' provide valuable context.</li>
                    <li><strong>One-Size-Fits-All Solutions:</strong> A gap in 'Project Management' means something different for a Junior Officer versus a Senior Manager. Tailor interventions to the job level and context.</li>
                    <li><strong>Analysis Paralysis:</strong> The goal is action. Use the data to make timely decisions about L&D priorities. Don't wait for the "perfect" analysis.</li>
                    <li><strong>Forgetting to Communicate:</strong> Share the high-level findings with staff. It shows that their input was valuable and explains the rationale behind upcoming training initiatives.</li>
                </ul>
            </Section>
        </div>
    );
};