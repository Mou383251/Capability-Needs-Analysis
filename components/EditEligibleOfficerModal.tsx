import React, { useState, useEffect } from 'react';
import { EligibleOfficer, EligibleOfficerStatus } from '../types';
import { XIcon } from './icons';

interface ModalProps {
    officer: EligibleOfficer;
    allOfficers: EligibleOfficer[];
    onUpdate: (officer: EligibleOfficer) => void;
    onClose: () => void;
    yearOptions: number[];
}

const statusOptions: EligibleOfficerStatus[] = ['Confirmed', 'Vacant', 'Displaced', 'Acting', 'Unattached', 'Probation', 'Other'];
const cnaOptions: ['Yes', 'No'] = ['Yes', 'No'];
const studiesOptions: ['Yes', 'No'] = ['Yes', 'No'];


const FormField: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        {children}
    </div>
);

const ReadOnlyField: React.FC<{ label: string, value: string | undefined }> = ({ label, value }) => (
     <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <p className="w-full p-2 text-sm rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 h-[38px] flex items-center">{value || 'N/A'}</p>
    </div>
);


// Define a type for the form's internal state, extending EligibleOfficer
// to include the `trainingYears` object for managing checkboxes.
type FormState = EligibleOfficer & {
    trainingYears: Record<number, boolean>;
};

export const EditEligibleOfficerModal: React.FC<ModalProps> = ({ officer, allOfficers, onUpdate, onClose, yearOptions }) => {
    // Initialize state with a function to ensure the correct shape from the start
    const [formState, setFormState] = useState<FormState>(() => ({
        ...officer,
        trainingYears: yearOptions.reduce((acc, year) => {
            acc[year] = officer.trainingYear.includes(year);
            return acc;
        }, {} as Record<number, boolean>),
    }));
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        // When the officer prop changes, reset the form state
        setFormState({
            ...officer,
            trainingYears: yearOptions.reduce((acc, year) => {
                acc[year] = officer.trainingYear.includes(year);
                return acc;
            }, {} as Record<number, boolean>),
        });
    }, [officer, yearOptions]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        
        if (formState.beenSentForStudies === 'Yes' && !formState.studiedWhere.trim()) {
            validationErrors.push('"Studied/Study Where?" is required if officer has been sent for studies.');
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Destructure to remove the temporary `trainingYears` property
        const { trainingYears, ...officerData } = formState;

        const updatedOfficer: EligibleOfficer = {
            ...officerData,
            studiedWhere: formState.beenSentForStudies === 'Yes' ? formState.studiedWhere.trim() : 'N/A',
            courseDetails: formState.courseDetails.trim(),
            notes: (formState.notes || '').trim(),
            trainingQuarters: (formState.trainingQuarters || '').trim(),
            // Convert the `trainingYears` object back to a `trainingYear` array
            trainingYear: Object.entries(formState.trainingYears)
                .filter(([, checked]) => checked)
                .map(([year]) => parseInt(year)),
        };

        onUpdate(updatedOfficer);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col">
                 <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit L&D Details</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{officer.occupant} ({officer.positionNumber})</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close edit dialog">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       <ReadOnlyField label="Division/Section" value={formState.branch} />
                       <ReadOnlyField label="Position Number" value={formState.positionNumber} />
                       <ReadOnlyField label="Grade" value={formState.grade} />
                       <ReadOnlyField label="Designation" value={formState.designation} />
                       <ReadOnlyField label="Occupant Name" value={formState.occupant} />
                       <FormField label="Employment Status">
                           <select name="status" value={formState.status} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                           </select>
                       </FormField>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="CNA Submission">
                            <select name="cnaSubmission" value={formState.cnaSubmission} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                {cnaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Have they been sent for studies?">
                            <select name="beenSentForStudies" value={formState.beenSentForStudies} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                            {studiesOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Attended Further Training?">
                             <select name="attendedFurtherTraining" value={formState.attendedFurtherTraining} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                {studiesOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        <FormField label="If Yes, where did they study?">
                            <input type="text" name="studiedWhere" value={formState.studiedWhere} onChange={handleInputChange} disabled={formState.beenSentForStudies === 'No'} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-800" />
                        </FormField>
                    </div>
                    <div>
                        <FormField label="Course Details">
                            <textarea name="courseDetails" value={formState.courseDetails} onChange={handleInputChange} rows={3} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                        </FormField>
                    </div>
                    <div>
                        <FormField label="2025 Quarters (e.g., Q2-Q4)">
                            <input type="text" name="trainingQuarters" value={formState.trainingQuarters || ''} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" placeholder="e.g., Q2-Q4" />
                        </FormField>
                    </div>
                    <div>
                        <FormField label="Notes/Tags">
                             <textarea name="notes" value={formState.notes} onChange={handleInputChange} rows={2} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" placeholder="e.g., Priority Fill, Critical Role, etc." />
                        </FormField>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select training year(s)</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 bg-slate-200 dark:bg-slate-800 rounded-md">
                            {yearOptions.map(year => (
                                <label key={year} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={formState.trainingYears[year] || false}
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