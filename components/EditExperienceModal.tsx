import React, { useState, useEffect } from 'react';
import { DesiredExperienceRecord, JobGroupType, FundingSourceType } from '../types';
import { XIcon } from './icons';

interface ModalProps {
    experience: DesiredExperienceRecord;
    onUpdate: (experience: DesiredExperienceRecord) => void;
    onClose: () => void;
}

const yearOptions = [2025, 2026, 2027, 2028, 2029];
const jobGroupOptions: JobGroupType[] = ['1️⃣ Senior Executive Managers', '2️⃣ Middle Managers', '3️⃣ All Line Staff'];
const fundingSourceOptions: FundingSourceType[] = ['TBD', 'Internal Budget', 'External', 'Donor', 'Other'];

const EXPERIENCE_MAPPING: Record<JobGroupType, string> = {
    '1️⃣ Senior Executive Managers': '• Must have wide experience in: Project Design & Implementation; Planning & Strategic Management; Policy Analysis & Evaluation\n• Wide knowledge of: Public Service Management Act; Public Service General Order; Public Finance Management Act; Cocoa Act of 1981; Constitution and laws of PNG',
    '2️⃣ Middle Managers': '• Must have sound knowledge of: Public Service Management Act; Public Service General Order; Public Finance Management Act; Cocoa Act of 1981; Principles & Guidelines for Cocoa Board operations in PNG',
    '3️⃣ All Line Staff': '• Must have basic knowledge of: Cocoa Act of 1981; Public Service Management Act; Public Service General Orders'
};

const FormField: React.FC<{ label: string, required?: boolean, children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

type FormState = DesiredExperienceRecord & {
    yearsCheckboxes: Record<number, boolean>;
};

export const EditExperienceModal: React.FC<ModalProps> = ({ experience, onUpdate, onClose }) => {
    const [formState, setFormState] = useState<FormState>(() => ({
        ...experience,
        yearsCheckboxes: yearOptions.reduce((acc, year) => {
            acc[year] = experience.years.includes(year);
            return acc;
        }, {} as Record<number, boolean>),
    }));
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        setFormState({
            ...experience,
            yearsCheckboxes: yearOptions.reduce((acc, year) => {
                acc[year] = experience.years.includes(year);
                return acc;
            }, {} as Record<number, boolean>),
        });
    }, [experience]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'jobGroup') {
            const newJobGroup = value as JobGroupType;
            const newTemplateText = EXPERIENCE_MAPPING[newJobGroup] || '';
            const currentText = formState.desiredWorkExperience;

            const isCustomText = currentText.trim() !== '' && !Object.values(EXPERIENCE_MAPPING).map(v => v.trim()).includes(currentText.trim());

            const applyTemplate = () => {
                setFormState(prev => ({
                    ...prev,
                    jobGroup: newJobGroup,
                    desiredWorkExperience: newTemplateText
                }));
            };

            if (isCustomText) {
                if (window.confirm('This will replace the custom "Desired Work Experience" with a template for the new job group. Do you want to continue?')) {
                    applyTemplate();
                }
            } else {
                applyTemplate();
            }
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckboxChange = (year: number) => {
        setFormState(prev => ({
            ...prev,
            yearsCheckboxes: { ...prev.yearsCheckboxes, [year]: !prev.yearsCheckboxes[year] }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);

        const validationErrors: string[] = [];
        if (!formState.jobGroup.trim()) validationErrors.push('Job Group is required.');
        if (!formState.desiredWorkExperience.trim()) validationErrors.push('Desired Work Experience is required.');
        if (!formState.institution.trim()) validationErrors.push('Institution is required.');
        if (!formState.location.trim()) validationErrors.push('Location is required.');
        if (!formState.duration.trim()) validationErrors.push('Duration is required.');

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        const { yearsCheckboxes, ...experienceData } = formState;

        const updatedExperience: DesiredExperienceRecord = {
            ...experienceData,
            years: Object.entries(formState.yearsCheckboxes)
                .filter(([, checked]) => checked)
                .map(([year]) => parseInt(year)),
        };

        onUpdate(updatedExperience);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Experience Record</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{experience.jobGroup}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close edit dialog">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Job Group" required>
                            <select name="jobGroup" value={formState.jobGroup} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
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
                            <input type="text" name="duration" value={formState.duration} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
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
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Year(s)</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {yearOptions.map(year => (
                                <label key={year} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={formState.yearsCheckboxes[year] || false}
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
                    <footer className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            Save Changes
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};