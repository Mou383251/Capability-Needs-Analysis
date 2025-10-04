import React, { useState } from 'react';
import { ChevronDownIcon } from '../icons';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <button
            onClick={onToggle}
            className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-expanded={isOpen}
        >
            <span className="text-lg">{title}</span>
            <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`grid grid-rows-[0fr] transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : ''}`}>
            <div className="overflow-hidden">
                <div className="p-4 pt-0 text-gray-600 dark:text-gray-300">
                    <div className="prose prose-sm dark:prose-invert max-w-none">{children}</div>
                </div>
            </div>
        </div>
    </div>
);

const policyContent: Record<string, React.ReactNode> = {
    'Executive Summary': <p>The GESI Policy provides a comprehensive framework for mainstreaming gender equity and social inclusion across the PNG public service to improve performance, service delivery, and national development outcomes.</p>,
    'Definitions & Acronyms': (
        <ul>
            <li><strong>GESI:</strong> Gender Equity and Social Inclusion.</li>
            <li><strong>Mainstreaming:</strong> Integrating GESI perspectives into all policies, programs, and organizational practices.</li>
            <li><strong>Discrimination:</strong> Any distinction, exclusion or restriction made on the basis of sex, disability, or other status.</li>
        </ul>
    ),
    'Importance and Benefits of GESI': <p>A diverse and inclusive public service is more innovative, effective, and better equipped to serve all citizens. It enhances staff morale, reduces corruption, and strengthens good governance.</p>,
    'Internal Mainstreaming Strategies': <p>Focuses on creating an equitable workplace through fair recruitment, promotion, performance management, flexible work arrangements, and zero tolerance for harassment and discrimination.</p>,
    'External Mainstreaming Strategies': <p>Ensures that all government policies, projects, and services are designed and delivered in a way that benefits men, women, persons with disabilities, and all social groups equitably.</p>,
    'GESI Roles & Responsibilities': <p>Outlines the specific duties of Departmental Heads, HR Managers, GESI Focal Points, and all public servants in implementing and monitoring the GESI Policy.</p>,
    'Leadership & Values': <p>Links GESI implementation to the PNG Public Service Leadership Capability Framework, emphasizing values like integrity, respect, and accountability.</p>,
    'Action Plan': <p>Details the specific, measurable, achievable, relevant, and time-bound (SMART) actions that agencies must undertake to institutionalize GESI.</p>,
};

export const GesiPolicyNavigator: React.FC = () => {
    const [openItem, setOpenItem] = useState<string | null>('Executive Summary');

    const handleToggle = (title: string) => {
        setOpenItem(openItem === title ? null : title);
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {Object.entries(policyContent).map(([title, content]) => (
                <AccordionItem 
                    key={title} 
                    title={title}
                    isOpen={openItem === title}
                    onToggle={() => handleToggle(title)}
                >
                    {content}
                </AccordionItem>
            ))}
        </div>
    );
};
