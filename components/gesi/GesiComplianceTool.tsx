import React, { useState, useMemo } from 'react';

const definitions: Record<string, string> = {
    "Gender Equity": "Fairness of treatment for women and men, according to their respective needs. This may include equal treatment or treatment that is different but which is considered equivalent in terms of rights, benefits, obligations and opportunities.",
    "Gender Equality": "The state or condition that affords women and men equal enjoyment of human rights, socially valued goods, opportunities and resources.",
    "Social Inclusion": "The process of improving the terms of participation in society, particularly for people who are disadvantaged, through enhancing opportunities, access to resources, voice and respect for rights.",
    "Mainstreaming": "The process of assessing the implications for women and men of any planned action, including legislation, policies or programmes, in all areas and at all levels. It is a strategy for making women's as well as men's concerns and experiences an integral dimension of the design, implementation, monitoring and evaluation of policies and programmes.",
    "Discrimination": "Any distinction, exclusion or restriction made on the basis of sex, disability, age, ethnicity, religion, sexual orientation, or other status, which has the effect or purpose of impairing or nullifying the recognition, enjoyment or exercise by all persons, on an equal footing, of all rights and freedoms.",
    "Vulnerable Groups": "Groups of people who are more likely to be in a disadvantaged position in society and face a higher risk of poverty and social exclusion. This includes, but is not limited to, persons with disabilities, people living with HIV, women, children, and remote communities."
};

const checklistItems = [
    "I have read and understand the GESI Policy.",
    "I use inclusive and gender-neutral language in my communications.",
    "I actively encourage participation from all team members in meetings.",
    "I am aware of the process for reporting harassment or discrimination.",
    "I consider the different needs of men, women, and vulnerable groups when performing my duties.",
    "I challenge stereotypes and non-inclusive behavior when I see it.",
    "I have a GESI-related objective in my performance agreement (if applicable).",
    "I ensure that services I provide are accessible to persons with disabilities."
];

export const GesiComplianceTool: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDefinitions = useMemo(() => {
        if (!searchTerm) return definitions;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return Object.entries(definitions)
            .filter(([term, definition]) => 
                term.toLowerCase().includes(lowerCaseSearch) || 
                definition.toLowerCase().includes(lowerCaseSearch)
            )
            .reduce((obj, [term, definition]) => {
                obj[term] = definition;
                return obj;
            }, {} as Record<string, string>);
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Definitions Search</h2>
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for terms like 'mainstreaming' or 'equity'..."
                    className="w-full p-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                />
                <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                    {Object.entries(filteredDefinitions).map(([term, definition]) => (
                        <div key={term}>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{term}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{definition}</p>
                        </div>
                    ))}
                     {Object.keys(filteredDefinitions).length === 0 && (
                        <p className="text-sm text-center text-gray-500">No definitions found for "{searchTerm}".</p>
                    )}
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">GESI Compliance Self-Assessment</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Use this checklist to reflect on your personal application of GESI principles.</p>
                <ul className="space-y-3">
                    {checklistItems.map((item, index) => (
                        <li key={index} className="flex items-start">
                            <input id={`self-check-${index}`} type="checkbox" className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor={`self-check-${index}`} className="ml-3 block text-sm text-gray-700 dark:text-gray-300">{item}</label>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
