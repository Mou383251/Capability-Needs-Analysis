import React from 'react';

const values = [
    {
        name: "Honesty",
        description: "Being truthful and transparent in all dealings, especially when addressing GESI-related issues and reporting on progress."
    },
    {
        name: "Integrity",
        description: "Upholding ethical principles and ensuring that decisions are made fairly and without bias, promoting a merit-based system for all."
    },
    {
        name: "Accountability",
        description: "Taking ownership for GESI outcomes, being answerable for actions, and ensuring that the GESI Policy is implemented effectively."
    },
     {
        name: "Wisdom",
        description: "Applying knowledge and experience to make sound judgments that consider the diverse needs and perspectives of all staff and citizens."
    },
    {
        name: "Respect",
        description: "Treating every individual with dignity, valuing their contributions, and fostering a workplace free from harassment and discrimination."
    },
    {
        name: "Responsibility",
        description: "Actively carrying out duties to advance GESI, challenging non-inclusive behavior, and contributing to a positive and supportive work environment."
    }
];

const ValueCard: React.FC<{ name: string; description: string }> = ({ name, description }) => (
    <div className="bg-gray-100 dark:bg-gray-900/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-lg text-amber-800 dark:text-amber-300">{name}</h3>
        <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">{description}</p>
    </div>
);

export const GesiLeadership: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Leadership & Values</h2>
                <p className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    The successful implementation of the GESI Policy is underpinned by the values outlined in the Papua New Guinea Public Service Leadership Capability Framework. Leaders and all public servants are expected to demonstrate these values in their daily work to create a truly inclusive public service.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {values.map(value => (
                    <ValueCard key={value.name} name={value.name} description={value.description} />
                ))}
            </div>
        </div>
    );
};