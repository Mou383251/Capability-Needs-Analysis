import React from 'react';
import { QUESTION_TEXT_MAPPING } from '../../types';

export const CnaQuestionnaire: React.FC = () => {
    const questions = Object.entries(QUESTION_TEXT_MAPPING);
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">CNA Questionnaire Items</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This application is configured to analyze the following questionnaire items. Ensure your imported data uses these codes as column headers for capability ratings.</p>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-200 dark:bg-gray-700/50">
                        <tr>
                            <th className="p-2 font-semibold">Code</th>
                            <th className="p-2 font-semibold">Question Text</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map(([code, text]) => (
                            <tr key={code} className="border-b border-gray-200 dark:border-gray-700">
                                <td className="p-2 font-mono font-bold">{code}</td>
                                <td className="p-2">{text}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};