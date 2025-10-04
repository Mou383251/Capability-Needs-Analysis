import React from 'react';
import { XIcon } from '../icons';

type Role = 'Secretary' | 'Executive' | 'HR' | 'Officer' | 'Focal Point';

interface RoleDetailProps {
    role: Role;
    onClose: () => void;
}

const ROLE_DETAILS: Record<Role, { name: string; duties: string[]; examples: string[] }> = {
    Secretary: {
        name: 'Secretary / Department Head',
        duties: [
            'Provide ultimate leadership and strategic direction for GESI implementation.',
            'Allocate adequate budget and resources for GESI activities.',
            'Ensure GESI is integrated into the agency’s Corporate Plan and performance monitoring.',
            'Hold executive managers accountable for GESI outcomes.',
        ],
        examples: [
            'Championing the GESI policy at all high-level meetings.',
            'Publicly recognizing GESI achievements within the department.',
            'Approving the annual GESI Action Plan and budget.',
        ],
    },
    Executive: {
        name: 'Executive Managers',
        duties: [
            'Drive GESI implementation within their respective divisions.',
            'Act as role models for inclusive behavior.',
            'Ensure divisional work plans and budgets incorporate GESI considerations.',
            'Monitor and report on GESI progress to the Department Head.',
        ],
        examples: [
            'Ensuring selection panels for recruitment are gender-balanced.',
            'Including a GESI-related KPI in all managers’ performance agreements.',
            'Conducting regular "gender-blind" reviews of divisional projects.',
        ],
    },
    HR: {
        name: 'HR Managers',
        duties: [
            'Review and revise all HR policies (recruitment, promotion, discipline) to align with GESI principles.',
            'Develop and implement GESI training programs.',
            'Establish and manage a confidential and effective grievance mechanism for harassment and discrimination.',
            'Collect, analyze, and report on sex-disaggregated and disability data.',
        ],
        examples: [
            'Advertising job vacancies through channels that reach diverse candidates.',
            'Implementing flexible work arrangements to support staff with family responsibilities.',
            'Analyzing staff turnover data to identify potential gender or inclusion issues.',
        ],
    },
    Officer: {
        name: 'All Public Officers',
        duties: [
            'Treat all colleagues and members of the public with respect and dignity.',
            'Complete mandatory GESI awareness training.',
            'Contribute to an inclusive and safe work environment.',
            'Report any instances of harassment or discrimination through appropriate channels.',
        ],
        examples: [
            'Using gender-neutral language in emails and reports.',
            'Actively listening to and valuing the contributions of all team members in meetings.',
            'Ensuring government services are delivered respectfully to all clients.',
        ],
    },
    'Focal Point': {
        name: 'GESI Focal Points',
        duties: [
            'Act as the primary contact person for GESI matters within the agency.',
            'Coordinate the development and implementation of the agency’s GESI Action Plan.',
            'Provide technical advice and support to colleagues on GESI mainstreaming.',
            'Facilitate GESI awareness sessions and share information.',
        ],
        examples: [
            'Organizing an event for International Women’s Day.',
            'Reviewing a draft project proposal to ensure it considers the needs of women and men.',
            'Maintaining a GESI resource corner on the office notice board or intranet.',
        ],
    },
};


export const GesiRoleDetail: React.FC<RoleDetailProps> = ({ role, onClose }) => {
    const details = ROLE_DETAILS[role];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{details.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close detail view">
                        <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </header>
                <main className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                     <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Key Duties</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            {details.duties.map((duty, index) => <li key={index}>{duty}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Practical Examples</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                             {details.examples.map((example, index) => <li key={index}>{example}</li>)}
                        </ul>
                    </div>
                </main>
            </div>
        </div>
    );
};
