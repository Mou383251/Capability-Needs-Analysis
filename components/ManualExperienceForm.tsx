import React, { useState } from 'react';
import { DesiredExperienceRecord, JobGroupType, FundingSourceType } from '../types';

interface FormProps {
    onConfirmAndAdd: (experience: DesiredExperienceRecord) => void;
}

const yearOptions = [2025, 2026, 2027, 2028, 2029];
const jobGroupOptions: JobGroupType[] = ['1️⃣ Senior Executive Managers', '2️⃣ Middle Managers', '3️⃣ All Line Staff'];
const fundingSourceOptions: FundingSourceType[] = ['TBD', 'Internal Budget', 'External', 'Donor', 'Other'];

const EXPERIENCE_MAPPING: Record<JobGroupType, string> = {
    '1️⃣ Senior Executive Managers': '• Must have wide experience in: Project Design & Implementation; Planning & Strategic Management; Policy Analysis & Evaluation\n• Wide knowledge of: Public Service Management Act; Public Service General Order; Public Finance Management Act; Cocoa Act of 1981; Constitution and laws of PNG',
    '2️⃣ Middle Managers': '• Must have sound knowledge of: Public Service Management Act; Public Service General Order; Public Finance Management Act; Cocoa Act of 1981; Principles & Guidelines for Cocoa Board operations in PNG',
    '3️⃣ All Line Staff': '• Must have basic knowledge of: Cocoa Act of 1981; Public Service Management Act; Public Service General Orders'
};

const initialFormState = {
    jobGroup: '' as JobGroupType | '',
    desiredWorkExperience: '',
    institution: '',
    location: '',
    duration: '',
    fundingSource: 'TBD' as FundingSourceType,
    years: yearOptions.reduce((acc, year) => ({ ...acc, [year]: false }), {} as Record<number, boolean>),
};

const FormField: React.FC<{ label: string, required?: boolean, children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

export const ManualExperienceForm: React.FC<FormProps> = ({ onConfirmAndAdd }) => {
    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<string[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'jobGroup') {
            const newJobGroup = value as JobGroupType;
            // When job group changes, automatically update the experience text.
            setFormState(prev => ({
                ...prev,
                jobGroup: newJobGroup,
                desiredWorkExperience: EXPERIENCE_MAPPING[newJobGroup] || prev.desiredWorkExperience
            }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckboxChange = (year: number) => {
        setFormState(prev => ({
            ...prev,
            years: { ...prev.years, [year]: !prev.years[year] }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);

        const validationErrors: string[] = [];
        if (!formState.jobGroup) validationErrors.push('Job Group is required.');
        if (!formState.desiredWorkExperience.trim()) validationErrors.push('Desired Work Experience is required.');
        if (!formState.institution.trim()) validationErrors.push('Institution is required.');
        if (!formState.location.trim()) validationErrors.push('Location is required.');
        if (!formState.duration.trim()) validationErrors.push('Duration is required.');

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        const newExperience: DesiredExperienceRecord = {
            id: crypto.randomUUID(),
            jobGroup: formState.jobGroup as JobGroupType,
            desiredWorkExperience: formState.desiredWorkExperience.trim(),
            institution: formState.institution.trim(),
            location: formState.location.trim(),
            duration: formState.duration.trim(),
            fundingSource: formState.fundingSource,
            years: Object.entries(formState.years)
                .filter(([, checked]) => checked)
                .map(([year]) => parseInt(year)),
        };

        onConfirmAndAdd(newExperience);
        // Do not reset form here, wait for parent to hide this component
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">Add New Experience Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Job Group" required>
                        <select name="jobGroup" value={formState.jobGroup} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                            <option value="" disabled>Select a job group...</option>
                            {jobGroupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </FormField>
                     <FormField label="Institution" required>
                        <input type="text" name="institution" value={formState.institution} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                    </FormField>
                     <FormField label="Location" required>
                        <input type="text" name="location" value={formState.location} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                    </FormField>
                     <FormField label="Duration" required>
                        <input type="text" name="duration" value={formState.duration} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" placeholder="e.g., 6 Months, 1 Year"/>
                    </FormField>
                     <FormField label="Funding Source">
                        <select name="fundingSource" value={formState.fundingSource} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                            {fundingSourceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </FormField>
                </div>
                <div>
                    <FormField label="Desired Work Experience" required>
                        <textarea name="desiredWorkExperience" value={formState.desiredWorkExperience} onChange={handleInputChange} rows={5} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                    </FormField>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Training Year(s)</label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {yearOptions.map(year => (
                            <label key={year} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={formState.years[year] || false}
                                    onChange={() => handleCheckboxChange(year)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                {year}
                            </label>
                        ))}
                    </div>
                </div>

                {errors.length > 0 && (
                    <div className="p-3 my-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                        <p className="font-bold mb-1">Please fix the following issues:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {errors.map((err, index) => <li key={index}>{err}</li>)}
                        </ul>
                    </div>
                )}
                
                <div className="pt-2 flex items-center">
                    <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        Add Experience Record
                    </button>
                </div>
            </form>
        </div>
    );
};