import React from 'react';

export const CnaLndPlanning: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">From Analysis to Action: The 70:20:10 Model</h2>
            <p className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-4">
                An effective L&D plan uses a blended learning approach. The 70:20:10 model is a powerful framework for this, suggesting that learning is most effective when it comes from a mix of experience, social interaction, and formal education.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h3 className="font-bold text-2xl text-blue-700 dark:text-blue-300">70% Experiential</h3>
                    <p className="text-sm mt-2">Learning through doing. This is the most important part of development.</p>
                    <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                        <li>On-the-job training</li>
                        <li>Stretch assignments</li>
                        <li>Job rotation / Secondments</li>
                        <li>Leading a project</li>
                        <li>Problem-solving tasks</li>
                    </ul>
                </div>
                 <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                    <h3 className="font-bold text-2xl text-green-700 dark:text-green-300">20% Social</h3>
                    <p className="text-sm mt-2">Learning from others.</p>
                     <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                        <li>Mentoring programs</li>
                        <li>Coaching from managers</li>
                        <li>Peer-to-peer learning</li>
                        <li>Communities of Practice</li>
                        <li>Professional networks</li>
                    </ul>
                </div>
                 <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
                    <h3 className="font-bold text-2xl text-purple-700 dark:text-purple-300">10% Formal</h3>
                    <p className="text-sm mt-2">Structured learning events.</p>
                     <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                        <li>Workshops & Seminars</li>
                        <li>University/College Courses</li>
                        <li>E-learning modules</li>
                        <li>Certifications</li>
                        <li>Reading books/articles</li>
                    </ul>
                </div>
            </div>
             <p className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mt-4">
                This application's AI-powered reports, such as the 'Automated L&D Recommendations', automatically suggest 70:20:10 interventions for identified gaps, providing a strong starting point for your strategic L&D plan.
            </p>
        </div>
    );
};