import React, { useState } from 'react';
import { EligibleOfficer, EligibleOfficerStatus } from '../types';

interface FormProps {
    officers: EligibleOfficer[];
    onAdd: (officer: EligibleOfficer) => void;
    yearOptions: number[];
}

const statusOptions: EligibleOfficerStatus[] = ['Confirmed', 'Vacant', 'Displaced', 'Acting', 'Unattached', 'Probation', 'Other'];
const cnaOptions: ['Yes', 'No'] = ['Yes', 'No'];
const studiesOptions: ['Yes', 'No'] = ['Yes', 'No'];

const createInitialFormState = (yearOptions: number[]) => ({
    branch: '',
    positionNumber: '',
    grade: '',
    designation: '',
    occupant: '',
    status: 'Confirmed' as EligibleOfficerStatus,
    cnaSubmission: 'No' as 'Yes' | 'No',
    beenSentForStudies: 'No' as 'Yes' | 'No',
    attendedFurtherTraining: 'No' as 'Yes' | 'No',
    studiedWhere: '',
    courseDetails: '',
    notes: '',
    trainingQuarters: '',
    trainingYears: yearOptions.reduce((acc, year) => ({ ...acc, [year]: false }), {} as Record<number, boolean>),
});

const FormField: React.FC<{ label: string, required?: boolean, children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

export const ManualEligibleOfficerForm: React.FC<FormProps> = ({ officers, onAdd, yearOptions }) => {
    const [formState, setFormState] = useState(() => createInitialFormState(yearOptions));
    const [errors, setErrors] = useState<string[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (year: number) => {
        setFormState(prev => ({
            ...prev,
            trainingYears: { ...prev.trainingYears, [year]: !prev.trainingYears[year] }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);

        const validationErrors: string[] = [];
        const requiredFields: (keyof typeof formState)[] = ['branch', 'positionNumber', 'grade', 'designation', 'occupant'];
        
        requiredFields.forEach(field => {
            // FIX: Cast field to string to allow replace method.
            const label = String(field).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            if (!String(formState[field]).trim()) {
                validationErrors.push(`${label} is required.`);
            }
        });

        if (officers.some(o => o.positionNumber.trim().toLowerCase() === formState.positionNumber.trim().toLowerCase())) {
            validationErrors.push('Position Number must be unique.');
        }

        if (formState.beenSentForStudies === 'Yes' && !formState.studiedWhere.trim()) {
            validationErrors.push('"Studied/Study Where?" is required if officer has been sent for studies.');
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        const newOfficer: EligibleOfficer = {
            id: crypto.randomUUID(),
            branch: formState.branch.trim(),
            positionNumber: formState.positionNumber.trim(),
            grade: formState.grade.trim(),
            designation: formState.designation.trim(),
            occupant: formState.occupant.trim(),
            status: formState.status,
            cnaSubmission: formState.cnaSubmission,
            beenSentForStudies: formState.beenSentForStudies,
            attendedFurtherTraining: formState.attendedFurtherTraining,
            studiedWhere: formState.beenSentForStudies === 'Yes' ? formState.studiedWhere.trim() : 'N/A',
            courseDetails: formState.courseDetails.trim(),
            notes: formState.notes.trim(),
            trainingQuarters: formState.trainingQuarters.trim(),
            trainingYear: Object.entries(formState.trainingYears)
                .filter(([, checked]) => checked)
                .map(([year]) => parseInt(year)),
        };
        
        onAdd(newOfficer);
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">Add New Officer to Plan</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Position Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="Branch/Division" required><input type="text" name="branch" value={formState.branch} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" /></FormField>
                        <FormField label="Position Number" required><input type="text" name="positionNumber" value={formState.positionNumber} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" /></FormField>
                        <FormField label="Grade" required><input type="text" name="grade" value={formState.grade} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" /></FormField>
                        <FormField label="Designation" required><input type="text" name="designation" value={formState.designation} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" /></FormField>
                        <FormField label="Occupant Name" required><input type="text" name="occupant" value={formState.occupant} onChange={handleInputChange} placeholder='Enter name or "VACANT"' className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" /></FormField>
                        <FormField label="Status" required><select name="status" value={formState.status} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">{statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></FormField>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">L&D Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="CNA Submission"><select name="cnaSubmission" value={formState.cnaSubmission} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">{cnaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></FormField>
                        <FormField label="Been Sent for Studies?"><select name="beenSentForStudies" value={formState.beenSentForStudies} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">{studiesOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></FormField>
                        <FormField label="Attended Further Training?"><select name="attendedFurtherTraining" value={formState.attendedFurtherTraining} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">{studiesOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></FormField>
                        <FormField label="If Yes, Studied/Study Where?"><input type="text" name="studiedWhere" value={formState.studiedWhere} onChange={handleInputChange} disabled={formState.beenSentForStudies === 'No'} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-800" /></FormField>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Course Details"><textarea name="courseDetails" value={formState.courseDetails} onChange={handleInputChange} rows={2} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" placeholder="e.g., Project Management Fundamentals; Business Writing" /></FormField>
                        <FormField label="2025 Quarters (e.g., Q2-Q4)">
                            <input type="text" name="trainingQuarters" value={formState.trainingQuarters} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" placeholder="e.g., Q2-Q4" />
                        </FormField>
                    </div>
                    <div className="mt-4"><FormField label="Notes/Tags"><textarea name="notes" value={formState.notes} onChange={handleInputChange} rows={2} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" placeholder="e.g., Priority Fill, Critical Role, etc." /></FormField></div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Annual Training Plan</label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 bg-slate-100 dark:bg-slate-900/40 rounded-md">
                        {yearOptions.map(year => (
                            <label key={year} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={formState.trainingYears[year] || false} onChange={() => handleCheckboxChange(year)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />{year}
                            </label>
                        ))}
                    </div>
                </div>

                {errors.length > 0 && (
                    <div className="p-3 my-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                        <p className="font-bold mb-1">Please fix the following issues:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">{errors.map((err, index) => <li key={index}>{err}</li>)}</ul>
                    </div>
                )}
                
                 <div className="pt-2 flex items-center">
                     <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400">
                        Add Officer to Plan
                    </button>
                 </div>
            </form>
        </div>
    );
};