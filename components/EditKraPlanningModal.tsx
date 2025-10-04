import React, { useState, useEffect } from 'react';
import { KraPlanningRecord, JobGroupType } from '../types';
import { XIcon } from './icons';

interface ModalProps {
    record: KraPlanningRecord;
    onUpdate: (record: KraPlanningRecord) => void;
    onClose: () => void;
}

const jobGroupOptions: JobGroupType[] = ['1️⃣ Senior Executive Managers', '2️⃣ Middle Managers', '3️⃣ All Line Staff'];
const yearOptions = Array.from({ length: 11 }, (_, i) => 2025 + i);

const FormField: React.FC<{ label: string, required?: boolean, children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const ReadOnlyField: React.FC<{ label: string, value: string | undefined }> = ({ label, value }) => (
     <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <p className="w-full p-2 text-sm rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 h-[38px] flex items-center">{value || 'N/A'}</p>
    </div>
);


export const EditKraPlanningModal: React.FC<ModalProps> = ({ record, onUpdate, onClose }) => {
    const [formState, setFormState] = useState<KraPlanningRecord>(record);

    useEffect(() => {
        setFormState(record);
    }, [record]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate({
            ...formState,
            year: Number(formState.year)
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col">
                 <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit KRA Staffing Plan</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Editing plan for {record.positionTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close edit dialog">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ReadOnlyField label="Key Result Area" value={formState.kraName} />
                        <ReadOnlyField label="Division" value={formState.division} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Priority Job Group" required>
                            <select name="jobGroup" value={formState.jobGroup} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                {jobGroupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Position Title" required>
                            <input type="text" name="positionTitle" value={formState.positionTitle} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                        </FormField>
                         <FormField label="Location">
                            <input type="text" name="location" value={formState.location} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                        </FormField>
                         <FormField label="Year">
                            <select name="year" value={formState.year} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </FormField>
                    </div>
                     <div>
                        <FormField label="Remarks/Notes">
                            <textarea name="remarks" value={formState.remarks} onChange={handleInputChange} rows={3} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                        </FormField>
                    </div>
                    
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