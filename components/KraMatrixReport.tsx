import React, { useState, useMemo, useEffect } from 'react';
import { KraRecord, JobGroupType, KraPlanningRecord } from '../types';
import { KRA_DATA } from '../data/kra';
import { XIcon, PresentationChartLineIcon, PencilIcon, TrashIcon, SaveIcon } from './icons';
import { EditKraPlanningModal } from './EditKraPlanningModal';
import { ExportMenu } from './ExportMenu';
import { exportToCsv, copyForSheets, ReportData, exportToPdf, exportToXlsx, exportToJson } from '../utils/export';


interface ReportProps {
  agencyName: string;
  onClose: () => void;
}

const DRAFT_STORAGE_KEY = 'cna_kra_planning_draft';
const jobGroupOptions: (JobGroupType | '')[] = ['', '1️⃣ Senior Executive Managers', '2️⃣ Middle Managers', '3️⃣ All Line Staff'];
const yearOptions = Array.from({ length: 11 }, (_, i) => 2025 + i);

const SUGGESTED_TITLES_BY_DIVISION: Record<string, string[]> = {
    'Research, Development & Extension': ['Agronomist', 'Pathologist', 'Breeder', 'Liaison Officer', 'Cocoa Breeder'],
    'Corporate Services': ['Economic Analyst', 'Statistician', 'Project Officer', 'HR Officer', 'Finance Officer', 'Legal Officer', 'Admin Officer', 'Internal Auditor', 'Marketing Officer', 'Cocoa Credit Officer', 'ICT Officer', 'Driver', 'PA', 'Cleaner', 'Typist', 'Gardener'],
    'Field Services, Export & Quality Assurance': ['Field Officer', 'Quality Assurance Officer'],
    'Executive': ['Executive Manager', 'Senior Advisor'],
};

const initialPlanningState = {
    positionTitle: '',
    location: '',
    year: yearOptions[0],
    remarks: '',
    jobGroup: '' as JobGroupType | '',
};

const FormField: React.FC<{ label: string, required?: boolean, children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

export const KraMatrixReport: React.FC<ReportProps> = ({ agencyName, onClose }) => {
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedJobGroup, setSelectedJobGroup] = useState<JobGroupType | ''>('');
    const [selectedKra, setSelectedKra] = useState('');

    const [planningRecords, setPlanningRecords] = useState<KraPlanningRecord[]>([]);
    const [newPlanningEntry, setNewPlanningEntry] = useState(initialPlanningState);
    const [recordToEdit, setRecordToEdit] = useState<KraPlanningRecord | null>(null);
    const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null);

    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const draftRecords = JSON.parse(savedDraft);
                if (Array.isArray(draftRecords)) {
                    setPlanningRecords(draftRecords);
                    showStatus('Loaded a saved KRA Staffing Plan draft.', 'info');
                }
            } catch (e) {
                console.error("Failed to parse KRA draft:", e);
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        }
    }, []);

    const showStatus = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const availableKras = useMemo(() => {
        return KRA_DATA
            .filter(kra => {
                const matchesDivision = selectedDivision ? kra.divisions.includes(selectedDivision) : true;
                const matchesJobGroup = selectedJobGroup ? kra.priorityJobGroups.includes(selectedJobGroup) : true;
                return matchesDivision && matchesJobGroup;
            })
            .map(kra => kra.name);
    }, [selectedDivision, selectedJobGroup]);

    const availableDivisions = useMemo(() => {
        const divisions = KRA_DATA
            .filter(kra => {
                const matchesKra = selectedKra ? kra.name === selectedKra : true;
                const matchesJobGroup = selectedJobGroup ? kra.priorityJobGroups.includes(selectedJobGroup) : true;
                return matchesKra && matchesJobGroup;
            })
            .flatMap(kra => kra.divisions);
        return [...new Set(divisions)].sort();
    }, [selectedKra, selectedJobGroup]);

    useEffect(() => {
        if (selectedDivision && !availableDivisions.includes(selectedDivision)) {
            setSelectedDivision('');
        }
    }, [availableDivisions, selectedDivision]);

    useEffect(() => {
        if (selectedKra && !availableKras.includes(selectedKra)) {
            setSelectedKra('');
        }
    }, [availableKras, selectedKra]);

    useEffect(() => {
        if (newPlanningEntry.jobGroup && selectedDivision) {
            const suggestedTitles = SUGGESTED_TITLES_BY_DIVISION[selectedDivision];
            if (suggestedTitles && suggestedTitles.length > 0) {
                const isCurrentTitleADefault = Object.values(SUGGESTED_TITLES_BY_DIVISION).flat().join(', ').includes(newPlanningEntry.positionTitle);
                if (!newPlanningEntry.positionTitle || isCurrentTitleADefault) {
                     setNewPlanningEntry(prev => ({
                        ...prev,
                        positionTitle: suggestedTitles.join(', ')
                    }));
                }
            }
        }
    }, [newPlanningEntry.jobGroup, selectedDivision]);


    const filteredKras = useMemo(() => {
        return KRA_DATA.filter(kra => {
            const matchesDivision = selectedDivision ? kra.divisions.includes(selectedDivision) : true;
            const matchesJobGroup = selectedJobGroup ? kra.priorityJobGroups.includes(selectedJobGroup) : true;
            const matchesKra = selectedKra ? kra.name === selectedKra : true;
            return matchesDivision && matchesJobGroup && matchesKra;
        });
    }, [selectedDivision, selectedJobGroup, selectedKra]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewPlanningEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPlanningRecord = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newPlanningEntry.jobGroup || !newPlanningEntry.positionTitle.trim()) {
            showStatus('Job Group and Position Title are required.', 'error');
            return;
        }

        const selectedKraData = KRA_DATA.find(k => k.name === selectedKra);
        if (selectedKraData && !selectedKraData.priorityJobGroups.includes(newPlanningEntry.jobGroup)) {
            const proceed = window.confirm(
                'Warning: The selected Job Group is not a priority for this KRA.\n\n' +
                `The priority groups for "${selectedKra}" are: ${selectedKraData.priorityJobGroups.join(', ')}.\n\n` +
                'Do you want to proceed with this entry anyway?'
            );
            if (!proceed) {
                return;
            }
        }

        const newRecord: KraPlanningRecord = {
            id: crypto.randomUUID(),
            kraName: selectedKra,
            division: selectedDivision,
            jobGroup: newPlanningEntry.jobGroup,
            positionTitle: newPlanningEntry.positionTitle.trim(),
            location: newPlanningEntry.location.trim(),
            year: Number(newPlanningEntry.year),
            remarks: newPlanningEntry.remarks.trim(),
        };

        setPlanningRecords(prev => [...prev, newRecord]);
        setNewPlanningEntry(initialPlanningState); // Reset form
    };
    
    const handleUpdateRecord = (updatedRecord: KraPlanningRecord) => {
        setPlanningRecords(prev => prev.map(rec => rec.id === updatedRecord.id ? updatedRecord : rec));
        setRecordToEdit(null);
        showStatus(`Updated record for ${updatedRecord.positionTitle}.`, 'success');
    };

    const handleDeleteRecord = (recordId: string) => {
        const record = planningRecords.find(r => r.id === recordId);
        if (record && window.confirm(`Delete plan for ${record.positionTitle}?`)) {
            setPlanningRecords(prev => prev.filter(r => r.id !== recordId));
            showStatus('Record deleted.', 'info');
        }
    };

    const handleSaveDraft = () => {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(planningRecords));
        showStatus('Draft saved successfully!', 'success');
    };

    const handleClearPlan = () => {
        if (window.confirm('Are you sure you want to clear the entire staffing plan? This cannot be undone.')) {
            setPlanningRecords([]);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            showStatus('Staffing plan cleared.', 'info');
        }
    };
    
    const getReportDataForExport = (): ReportData => {
        const KRA_THEME_MAP = new Map(KRA_DATA.map(k => [k.name, k.thematicProgrammeArea]));
        const tableHeaders = ["Organization", "Plan Period", "KRA", "Thematic Area", "Division", "Job Group", "Job Titles", "Comments"];
        
        const tableRows = planningRecords.map(rec => [
            "Public Service Department",
            rec.year,
            rec.kraName,
            KRA_THEME_MAP.get(rec.kraName) || 'N/A',
            rec.division,
            rec.jobGroup,
            rec.positionTitle,
            rec.remarks
        ]);

        return {
            title: 'KRA Staffing Plan',
            sections: [{ title: 'KRA Staffing Plan', content: [{ type: 'table', headers: tableHeaders, rows: tableRows }] }]
        };
    };

    const handleExport = (format: 'pdf' | 'xlsx' | 'json' | 'csv' | 'sheets') => {
        try {
            const reportData = getReportDataForExport();
            switch (format) {
                case 'csv': exportToCsv(reportData); break;
                case 'sheets': copyForSheets(reportData).then(msg => showStatus(msg, 'success')).catch(err => showStatus(err, 'error')); break;
                case 'pdf': exportToPdf(reportData); break;
                case 'xlsx': exportToXlsx(reportData); break;
                case 'json': exportToJson(reportData); break;
            }
        } catch (e) {
            console.error("Export failed:", e);
            showStatus("Could not export report.", 'error');
        }
    };


    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
             {recordToEdit && (
                <EditKraPlanningModal
                    record={recordToEdit}
                    onUpdate={handleUpdateRecord}
                    onClose={() => setRecordToEdit(null)}
                />
            )}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <PresentationChartLineIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KRA Strategic Matrix & Staffing Plan</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
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
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Use this matrix to align staff planning with the {agencyName}'s Key Result Areas (KRAs). Filter by Division, Job Group, or KRA to identify strategic priorities. Select a KRA and Division to begin adding to the staffing plan below.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Key Result Area</label>
                                <select value={selectedKra} onChange={(e) => setSelectedKra(e.target.value)} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                    <option value="">All Key Result Areas</option>
                                    {availableKras.map(name => <option key={name} value={name}>{name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Responsible Division</label>
                                <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                    <option value="">All Divisions</option>
                                    {availableDivisions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Priority Job Group</label>
                                <select value={selectedJobGroup} onChange={(e) => setSelectedJobGroup(e.target.value as JobGroupType | '')} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                    {jobGroupOptions.map(jg => <option key={jg} value={jg}>{jg || 'All Job Groups'}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto mb-6 bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">KRA Reference Matrix</h3>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-200 dark:bg-slate-700/50 text-xs uppercase text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="p-2 font-semibold">Key Result Area (KRA)</th>
                                    <th className="p-2 font-semibold">Description</th>
                                    <th className="p-2 font-semibold">Responsible Division(s)</th>
                                    <th className="p-2 font-semibold">Priority Job Group(s)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKras.map(kra => (
                                    <tr key={kra.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-2 font-bold align-top">{kra.name}</td>
                                        <td className="p-2 align-top">{kra.description}</td>
                                        <td className="p-2 align-top"><ul className="list-disc list-inside">{kra.divisions.map(d => <li key={d}>{d}</li>)}</ul></td>
                                        <td className="p-2 align-top"><ul className="list-disc list-inside">{kra.priorityJobGroups.map(jg => <li key={jg}>{jg}</li>)}</ul></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredKras.length === 0 && <div className="text-center p-8 text-slate-500">No KRAs match the current filter criteria.</div>}
                    </div>

                    {selectedKra && selectedDivision && (
                        <div className="animate-fade-in space-y-6">
                            <form onSubmit={handleAddPlanningRecord} className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 border-b pb-2">Add New Staffing Plan Entry</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Adding plan for KRA: <strong className="text-slate-800 dark:text-slate-200">{selectedKra}</strong> / Division: <strong className="text-slate-800 dark:text-slate-200">{selectedDivision}</strong></p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <FormField label="Priority Job Group" required><select name="jobGroup" value={newPlanningEntry.jobGroup} onChange={handleFormChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"><option value="" disabled>Select Job Group</option>{jobGroupOptions.filter(Boolean).map(jg => <option key={jg} value={jg}>{jg}</option>)}</select></FormField>
                                    <FormField label="Position Title" required><input type="text" name="positionTitle" value={newPlanningEntry.positionTitle} onChange={handleFormChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" /></FormField>
                                    <FormField label="Location"><input type="text" name="location" value={newPlanningEntry.location} onChange={handleFormChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" /></FormField>
                                    <FormField label="Year"><select name="year" value={newPlanningEntry.year} onChange={handleFormChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select></FormField>
                                    <div className="lg:col-span-2"><FormField label="Remarks/Notes"><textarea name="remarks" value={newPlanningEntry.remarks} onChange={handleFormChange} rows={1} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" /></FormField></div>
                                </div>
                                <div className="mt-4"><button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Add to Plan</button></div>
                            </form>
                             <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                                <div className="flex justify-between items-center mb-2 pb-2 border-b">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">KRA Staffing Plan ({planningRecords.length} Entries)</h3>
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveDraft} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"><SaveIcon className="w-4 h-4"/> Save Draft</button>
                                        <button onClick={handleClearPlan} className="px-3 py-1.5 text-sm bg-red-600/80 text-white font-semibold rounded-md hover:bg-red-700 transition-colors">Clear Plan</button>
                                        <ExportMenu onExport={handleExport as any} />
                                    </div>
                                </div>
                                <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                                    <thead className="bg-slate-200 dark:bg-slate-700/50 text-xs uppercase text-slate-500 dark:text-slate-400"><tr>
                                        <th className="p-2 font-semibold">KRA</th><th className="p-2 font-semibold">Division</th><th className="p-2 font-semibold">Job Group</th><th className="p-2 font-semibold">Position Title</th>
                                        <th className="p-2 font-semibold">Location</th><th className="p-2 font-semibold">Year</th><th className="p-2 font-semibold">Remarks</th><th className="p-2 font-semibold text-center">Actions</th>
                                    </tr></thead>
                                    <tbody>{planningRecords.map(rec => (
                                        <tr key={rec.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-2">{rec.kraName}</td><td className="p-2">{rec.division}</td><td className="p-2">{rec.jobGroup}</td><td className="p-2 font-semibold">{rec.positionTitle}</td>
                                            <td className="p-2">{rec.location}</td><td className="p-2">{rec.year}</td><td className="p-2">{rec.remarks}</td>
                                            <td className="p-2 text-center"><div className="flex items-center justify-center gap-1">
                                                <button onClick={() => setRecordToEdit(rec)} className="p-1 text-slate-500 hover:text-blue-600" aria-label="Edit"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDeleteRecord(rec.id)} className="p-1 text-slate-500 hover:text-red-600" aria-label="Delete"><TrashIcon className="w-4 h-4"/></button>
                                            </div></td>
                                        </tr>
                                    ))}</tbody>
                                </table>{planningRecords.length === 0 && <div className="text-center p-8 text-slate-500">No staffing plans added yet.</div>}</div>
                             </div>
                        </div>
                    )}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Data sourced from the {agencyName} Strategic Development Plan.</p>
                </footer>
            </div>
        </div>
    );
};