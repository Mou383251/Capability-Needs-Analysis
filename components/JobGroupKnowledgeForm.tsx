import React, { useState, useEffect } from 'react';
import { JobGroupKnowledgeRecord, JobGroupKnowledgeType, DurationType, FundingSourceKnowledgeType } from '../types';
import { XIcon, AcademicCapIcon, TrashIcon, SaveIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToCsv, copyForSheets, ReportData } from '../utils/export';

interface ReportProps {
    onClose: () => void;
}

const DRAFT_STORAGE_KEY = 'cna_jobGroupKnowledgeDraft';
const yearOptions = [2023, 2024, 2025, 2026];
const jobGroupOptions: JobGroupKnowledgeType[] = ['Senior Executive Managers', 'Senior/Middle Managers', 'Supervisors', 'All Line Staff', 'Executive Secretaries'];
const durationOptions: DurationType[] = ['Less than 6 months', '6 to 12 months', '1 to 2 years', 'More than 2 years'];
const fundingSourceOptions: FundingSourceKnowledgeType[] = ['Department', 'GoPNG', 'Donor Agency', 'Self-funded', 'Other'];

const initialFormState = {
    jobGroup: '' as JobGroupKnowledgeType | '',
    educationalProgramme: '',
    institution: '',
    location: '',
    duration: 'Less than 6 months' as DurationType,
    fundingSource: 'Department' as FundingSourceKnowledgeType,
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

export const JobGroupKnowledgeForm: React.FC<ReportProps> = ({ onClose }) => {
    const [records, setRecords] = useState<JobGroupKnowledgeRecord[]>([]);
    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<string[]>([]);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);

    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (savedDraft) {
                setRecords(JSON.parse(savedDraft));
                showStatus('Loaded saved draft.', 'info');
            }
        } catch (e) {
            console.error(e);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
    }, []);

    const showStatus = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (year: number) => {
        setFormState(prev => ({ ...prev, years: { ...prev.years, [year]: !prev.years[year] } }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        const validationErrors: string[] = [];
        if (!formState.jobGroup) validationErrors.push('Job Group is required.');
        if (!formState.educationalProgramme.trim()) validationErrors.push('Educational Programme is required.');
        if (!Object.values(formState.years).some(y => y)) validationErrors.push('At least one Year Plan must be selected.');

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        const newRecord: JobGroupKnowledgeRecord = {
            id: `${new Date().toISOString()}-${Math.random()}`,
            jobGroup: formState.jobGroup as JobGroupKnowledgeType,
            educationalProgramme: formState.educationalProgramme.trim(),
            institution: formState.institution.trim(),
            location: formState.location.trim(),
            duration: formState.duration,
            fundingSource: formState.fundingSource,
            years: Object.entries(formState.years).filter(([, checked]) => checked).map(([year]) => parseInt(year)),
        };

        setRecords(prev => [...prev, newRecord]);
        setFormState(initialFormState); // Reset form
        showStatus('Record added successfully!', 'success');
    };
    
    const handleDeleteRecord = (id: string) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            setRecords(prev => prev.filter(r => r.id !== id));
            showStatus('Record deleted.', 'info');
        }
    };

    const handleSaveDraft = () => {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(records));
        showStatus('Draft saved successfully!', 'success');
    };

    const getReportDataForExport = (): ReportData => {
        const tableHeaders = ["Job Group", "Educational Programme", "Institution", "Location", "Duration", "Funding Source", ...yearOptions.map(String)];
        const tableRows = records.map(rec => [
            rec.jobGroup,
            rec.educationalProgramme,
            rec.institution,
            rec.location,
            rec.duration,
            rec.fundingSource,
            ...yearOptions.map(year => (rec.years.includes(year) ? '✔' : ''))
        ]);
        return {
            title: "Job Group Knowledge Improvement Plan",
            sections: [{ title: "Knowledge Improvement Plan", content: [{ type: 'table', headers: tableHeaders, rows: tableRows }] }]
        };
    };

    const handleExport = (format: 'csv' | 'sheets') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'csv') exportToCsv(reportData);
            if (format === 'sheets') copyForSheets(reportData).then(msg => showStatus(msg, 'success')).catch(err => showStatus(err, 'error'));
        } catch (e) {
            console.error("Export failed:", e);
            showStatus("Could not export report.", 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <AcademicCapIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Group – Knowledge Improvement</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close form">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6 relative">
                     {statusMessage && (
                        <div className={`absolute top-4 right-6 p-3 rounded-lg text-sm font-semibold shadow-lg animate-fade-in-out z-20 ${
                            statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 
                            statusMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {statusMessage.text}
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold">Add New Programme</h3>
                            <FormField label="📌 Job Group" required><select name="jobGroup" value={formState.jobGroup} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"><option value="" disabled>Select...</option>{jobGroupOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></FormField>
                            <FormField label="🎓 Educational Improvement Programme" required><input type="text" name="educationalProgramme" value={formState.educationalProgramme} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" /></FormField>
                            <FormField label="🏛 Institution"><input type="text" name="institution" value={formState.institution} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" /></FormField>
                            <FormField label="📍 Location"><input type="text" name="location" value={formState.location} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" /></FormField>
                            <FormField label="⏳ Duration"><select name="duration" value={formState.duration} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">{durationOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></FormField>
                            <FormField label="💰 Funding Source"><select name="fundingSource" value={formState.fundingSource} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">{fundingSourceOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></FormField>
                            <FormField label="📅 Year Plan" required><div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">{yearOptions.map(y => <label key={y} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formState.years[y]} onChange={() => handleCheckboxChange(y)} className="h-4 w-4 rounded" />{y}</label>)}</div></FormField>
                            {errors.length > 0 && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm"><ul>{errors.map((err, i) => <li key={i}>{err}</li>)}</ul></div>}
                            <div className="flex gap-2"><button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Add Entry</button></div>
                        </form>
                        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Programme List ({records.length})</h3>
                                <div className="flex gap-2">
                                    <button onClick={handleSaveDraft} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 rounded-md"><SaveIcon className="w-4 h-4" /> Save</button>
                                    <ExportMenu onExport={handleExport} />
                                </div>
                            </div>
                            <div className="overflow-auto flex-1">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0"><tr>{["Programme", "Job Group", "Actions"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
                                    <tbody>
                                        {records.map(rec => (
                                            <tr key={rec.id} className="border-b border-slate-200 dark:border-slate-700">
                                                <td className="p-2 font-semibold">{rec.educationalProgramme}<p className="font-normal text-slate-500">{rec.institution} - {rec.duration}</p></td>
                                                <td className="p-2">{rec.jobGroup}</td>
                                                <td className="p-2"><button onClick={() => handleDeleteRecord(rec.id)} className="p-1 text-slate-500 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {records.length === 0 && <div className="text-center p-8 text-slate-500">No programmes added yet.</div>}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
