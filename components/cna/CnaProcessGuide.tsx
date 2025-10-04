import React from 'react';

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-amber-600 text-white font-bold rounded-full">{number}</div>
        <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200">{title}</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
        </div>
    </div>
);

export const CnaProcessGuide: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">Step-by-Step Guide to Conducting a CNA</h2>
            <Step number={1} title="Define Strategic Objectives">
                <p>Start with the end in mind. Review your organization's Corporate Plan, divisional work plans, and strategic goals. What capabilities are essential to achieve these goals in the next 1-3 years?</p>
            </Step>
            <Step number={2} title="Identify Required Capabilities">
                <p>For each objective, list the specific knowledge, skills, and behaviors required from your workforce. This can be done through workshops with managers and subject matter experts.</p>
            </Step>
            <Step number={3} title="Assess Current Capabilities">
                <p>This is where the CNA survey comes in. Use a structured questionnaire to allow staff to self-assess their current proficiency against the required capabilities. This can be supplemented with manager assessments and performance data (e.g., SPA ratings).</p>
            </Step>
            <Step number={4} title="Analyze the Gaps">
                <p>Compare the 'required' capability levels with the 'current' levels to identify gaps. The formula is: <strong>Gap = Required Level - Current Level</strong>. Analyze this data to find trends: What are the most common gaps? Are there specific gaps in certain divisions or job levels?</p>
            </Step>
            <Step number={5} title="Prioritize Needs & Develop Solutions">
                <p>Prioritize the identified gaps based on their impact on strategic goals. For each priority gap, develop a learning solution using the 70:20:10 model (on-the-job, social, formal learning). This forms the basis of your L&D plan.</p>
            </Step>
             <Step number={6} title="Implement & Evaluate">
                <p>Roll out the training plan. It is crucial to evaluate the effectiveness of the training by reassessing capabilities after the intervention to measure improvement and calculate return on investment.</p>
            </Step>
        </div>
    );
};