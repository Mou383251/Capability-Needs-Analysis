import React, { useState } from 'react';
import { UserCircleIcon } from '../icons';
import { GesiRoleDetail } from './GesiRoleDetail';

type Role = 'Secretary' | 'Executive' | 'HR' | 'Officer' | 'Focal Point';

const ROLES: { id: Role; name: string }[] = [
    { id: 'Secretary', name: 'Secretary / Department Head' },
    { id: 'Executive', name: 'Executive Managers' },
    { id: 'HR', name: 'HR Managers' },
    { id: 'Officer', name: 'All Public Officers' },
    { id: 'Focal Point', name: 'GESI Focal Points' },
];

export const GesiRolesMap: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">GESI Roles & Responsibilities</h2>
                <p className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    Implementing the GESI Policy is a shared responsibility. Every public servant has a role to play in creating an inclusive and equitable workplace. Click on a role below to see specific duties and practical examples.
                </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
                {ROLES.map((role, index) => (
                    <React.Fragment key={role.id}>
                        <button 
                            onClick={() => setSelectedRole(role.id)}
                            className="group flex items-center w-full max-w-md p-4 bg-gray-100 dark:bg-gray-900/40 rounded-lg shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-all duration-300 transform hover:scale-105"
                            aria-haspopup="true"
                            aria-expanded={selectedRole === role.id}
                        >
                            <UserCircleIcon className="w-8 h-8 mr-4 text-amber-600" />
                            <span className="text-md font-semibold text-gray-800 dark:text-gray-200">{role.name}</span>
                        </button>
                        {index < ROLES.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {selectedRole && (
                <GesiRoleDetail role={selectedRole} onClose={() => setSelectedRole(null)} />
            )}
        </div>
    );
};