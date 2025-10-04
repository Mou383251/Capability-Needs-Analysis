import React, { useState, useEffect, useMemo } from 'react';
import { DesiredExperienceRecord, JobGroupType, FundingSourceType } from '../types';
import { XIcon, AcademicCapIcon, PencilIcon, TrashIcon, SaveIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToCsv, copyForSheets, ReportData } from '../utils/export';
import { ManualExperienceForm } from './ManualExperienceForm';
import { EditExperienceModal } from './EditExperienceModal';

interface ReportProps {
  onClose: () => void;
}

const DRAFT_STORAGE_KEY = 'cnaDashboard_desiredExperienceDraft';
const yearHeaders = [2025, 2026, 2027, 2028, 2029];

const NextStepsPanel: React.FC<{
    onAddAnother: () => void;
    onSaveDraft: () => void;
    onSubmitPlan: () => void;
    onExport: (format: 'sheets' | 'csv') => void;
}> = ({ onAddAnother, onSaveDraft, onSubmitPlan, onExport }) => (
    <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 p-6 text-center animate-fade-in">
        <h3 className="text-xl font-bold text-green-700 dark:text-green-300">Experience Record Added!</h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">What would you like to do next?</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button onClick={onAddAnother} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                <span>➕</span>
                <span>Add Another Desired Experience</span>
            </button>
            <button onClick={onSaveDraft} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-blue-800 rounded-md hover:bg-slate-300 dark:hover:bg-blue-700 transition-colors">
                <span>💾</span>
                <span>Save Draft</span>
            </button>
            <button onClick={onSubmitPlan} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
                <span>✅</span>
                <span>Submit</span>
            </button>
            <button onClick={() => onExport('sheets')} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-blue-800 rounded-md hover:bg-slate-300 dark:hover:bg-blue-700 transition-colors">
                <span>📤</span>
                <span>Export to Google Sheets</span>
            </button>
            <button onClick={() => onExport('csv')} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-blue-800 rounded-md hover:bg-slate-300 dark:hover:bg-blue-700 transition-colors">
                <span>📤</span>
                <span>Export to CSV</span>
            </button>
        </div>
    </div>
);


export const DesiredExperienceReport: React.FC<ReportProps> = ({ onClose }) => {
    const [experiences, setExperiences] = useState<DesiredExperienceRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState('');
    const [experienceToEdit, setExperienceToEdit] = useState<DesiredExperienceRecord | null>(null);
    const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null);
    const [showNextSteps, setShowNextSteps] = useState(false);
    const [formKey, setFormKey] = useState(0);
        
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const draftExperiences = JSON.parse(savedDraft);
                if (Array.isArray(draftExperiences)) {
                    setExperiences(draftExperiences);
                    showStatus('Loaded a saved draft.', 'info');
                }
            } catch (e) {
                console.error("Failed to parse saved draft:", e);
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        }
        setLoading(false);
    }, []);
    
    const showStatus = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleConfirmAndAddExperience = (newExperience: DesiredExperienceRecord) => {
        if (window.confirm('Do you want to save this Desired Experience entry?')) {
            setExperiences(prev => [...prev, newExperience]);
            setShowNextSteps(true);
        }
    };
    
    const handleAddAnother = () => {
        setShowNextSteps(false);
        setFormKey(prevKey => prevKey + 1); // Increment key to force re-mount and reset the form
    };

    const handleUpdateExperience = (updatedExperience: DesiredExperienceRecord) => {
        setExperiences(prev => prev.map(exp => exp.id === updatedExperience.id ? updatedExperience : exp));
        setExperienceToEdit(null);
        showStatus(`Successfully updated record for ${updatedExperience.jobGroup}. Remember to save your draft.`);
    };

    const handleDeleteExperience = (experienceId: string) => {
        const experienceToDelete = experiences.find(exp => exp.id === experienceId);
        if (experienceToDelete && window.confirm(`Are you sure you want to delete the experience for ${experienceToDelete.jobGroup}?`)) {
            setExperiences(prev => prev.filter(exp => exp.id !== experienceId));
            showStatus(`Deleted experience record for ${experienceToDelete.jobGroup}.`);
        }
    };
    
    const handleSaveDraft = () => {
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(experiences));
            showStatus('Draft saved successfully!', 'success');
        } catch (e) {
            console.error("Failed to save draft:", e);
            showStatus('Could not save draft. Local storage may be full.', 'error');
        }
    };

    const handleClearDraft = () => {
        if (window.confirm("Are you sure you want to clear the current draft and start over?")) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            setExperiences([]);
            showStatus('Draft cleared.', 'info');
        }
    };

    const handleSubmitPlan = () => {
        if (window.confirm("Are you sure you want to submit this plan? This will finalize the list and clear the saved draft.")) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            showStatus('Plan submitted successfully!', 'success');
        }
    };

    const filteredExperiences = useMemo(() => {
        if (!experiences) return [];
        const lowerCaseFilter = filter.toLowerCase();
        return experiences.filter(exp => 
            Object.values(exp).some(val => 
                String(val).toLowerCase().includes(lowerCaseFilter)
            )
        );
    }, [experiences, filter]);

    const getReportDataForExport = (): ReportData => {
        const tableHeaders = ["Job Group", "Desired Work Experience", "Institution", "Location", "Duration", "Funding Source", ...yearHeaders.map(String)];
        const tableRows = experiences.map(exp => [
            exp.jobGroup,
            exp.desiredWorkExperience,
            exp.institution,
            exp.location,
            exp.duration,
            exp.fundingSource,
            ...yearHeaders.map(year => exp.years.includes(year) ? '✔' : '')
        ]);

        return {
            title: "Desired Work Experience Plan",
            sections: [{
                title: "Desired Work Experience Plan",
                content: [{
                    type: 'table',
                    headers: tableHeaders,
                    rows: tableRows,
                }]
            }]
        };
    };

    const handleExport = (format: 'csv' | 'sheets') => {
       try {
            const reportData = getReportDataForExport();
            if (format === 'csv') exportToCsv(reportData);
            if (format === 'sheets') copyForSheets(reportData).then(msg => showStatus(msg, 'success')).catch(err => showStatus(err.toString(), 'error'));
        } catch (e) {
            console.error("Export failed:", e);
            showStatus("Could not export report.", 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            {experienceToEdit && (
                <EditExperienceModal
                    experience={experienceToEdit}
                    onUpdate={handleUpdateExperience}
                    onClose={() => setExperienceToEdit(null)}
                />
            )}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <AcademicCapIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Desired Work Experience Plan</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close form">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6 relative">
                    {statusMessage && (
                        <div className={`absolute top-4 right-6 p-3 rounded-lg text-sm font-semibold shadow-lg animate-fade-in-out z-20 ${
                            statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 
                            statusMessage.type === 'error' ? 'bg-red-100 text-red-800 dark:text-red-300' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {statusMessage.text}
                        </div>
                    )}

                    {showNextSteps ? (
                        <NextStepsPanel
                            onAddAnother={handleAddAnother}
                            onSaveDraft={handleSaveDraft}
                            onSubmitPlan={handleSubmitPlan}
                            onExport={handleExport}
                        />
                    ) : (
                        <ManualExperienceForm key={formKey} onConfirmAndAdd={handleConfirmAndAddExperience} />
                    )}

                    <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Experience Records ({filteredExperiences.length})</h3>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    placeholder="Filter records..."
                                    className="p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"
                                />
                                <button onClick={handleSaveDraft} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 rounded-md"><SaveIcon className="w-4 h-4" /> Save</button>
                                <ExportMenu onExport={handleExport as any} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-200 dark:bg-slate-700/50">
                                    <tr>
                                        {['Job Group', 'Experience', 'Institution', 'Location', 'Duration', 'Funding', ...yearHeaders.map(String), 'Actions'].map(h => <th key={h} className="p-2">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExperiences.map(exp => (
                                        <tr key={exp.id} className="border-b border-slate-200 dark:border-slate-700">
                                            <td className="p-2">{exp.jobGroup}</td>
                                            <td className="p-2 truncate max-w-xs" title={exp.desiredWorkExperience}>{exp.desiredWorkExperience}</td>
                                            <td className="p-2">{exp.institution}</td>
                                            <td className="p-2">{exp.location}</td>
                                            <td className="p-2">{exp.duration}</td>
                                            <td className="p-2">{exp.fundingSource}</td>
                                            {yearHeaders.map(year => (
                                                <td key={year} className="p-2 text-center">{exp.years.includes(year) ? '✔' : ''}</td>
                                            ))}
                                            <td className="p-2">
                                                <div className="flex gap-2">
                                                    <button onClick={() => setExperienceToEdit(exp)} className="p-1 text-slate-500 hover:text-blue-600"><PencilIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteExperience(exp.id)} className="p-1 text-slate-500 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredExperiences.length === 0 && <div className="text-center p-8 text-slate-500">No experience records added yet.</div>}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
