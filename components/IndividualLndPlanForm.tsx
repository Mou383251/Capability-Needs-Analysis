import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IndividualLndPlanRecord, OfficerStatusType, LndTrainingNeed, LndFormFundingSource, AgeGroupType, PerfLevelType, PromotionPotentialType } from '../types';
import { XIcon, IdentificationIcon, TrashIcon, SaveIcon, ChevronDownIcon, PencilIcon, DocumentIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToCsv, copyForSheets, ReportData, exportToPdf, exportToDocx, exportToXlsx } from '../utils/export';

// --- Autocomplete Input Component ---
interface AutocompleteInputProps {
    name: string;
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    required?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ name, value, onChange, suggestions, placeholder, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredSuggestions = useMemo(() => {
        if (!value) return suggestions;
        const lowerValue = value.toLowerCase();
        return suggestions.filter(s => s.toLowerCase().includes(lowerValue));
    }, [value, suggestions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (suggestion: string) => {
        onChange(suggestion);
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % filteredSuggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        } else if (e.key === 'Enter') {
            if (isOpen && activeIndex >= 0 && filteredSuggestions[activeIndex]) {
                e.preventDefault();
                handleSelect(filteredSuggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setActiveIndex(-1);
        }
    };
    
    const highlightMatch = (text: string, query: string) => {
        if (!query) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <strong key={i}>{part}</strong>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                name={name}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
                className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                aria-autocomplete="list"
                aria-expanded={isOpen}
            />
            {isOpen && filteredSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                        <li
                            key={suggestion}
                            onClick={() => handleSelect(suggestion)}
                            className={`px-3 py-2 text-sm cursor-pointer ${index === activeIndex ? 'bg-blue-500 text-white' : 'hover:bg-blue-100 dark:hover:bg-blue-900'}`}
                        >
                           {highlightMatch(suggestion, value)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
// --- End Autocomplete Input Component ---


interface ReportProps {
    onClose: () => void;
}

const DRAFT_STORAGE_KEY = 'cna_individualLndPlansDraft';
const officerStatusOptions: OfficerStatusType[] = ['Confirmed', 'Acting', 'Contract', 'Probation', 'Other'];
const fundingSourceOptions: LndFormFundingSource[] = ['Department', 'GoPNG', 'Donor', 'Self-funded'];
const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
const ageGroupOptions: AgeGroupType[] = ['<30', '30–40', '41–50', '>50'];
const performanceLevelOptions: PerfLevelType[] = ['Excellent (86–100%)', 'Satisfactory (70–85%)', 'Marginal (50–69%)', 'Unsatisfactory (0–49%)'];
const promotionPotentialOptions: PromotionPotentialType[] = ['Overdue for Promotion', 'Promotion Now', 'Needs Development', 'Not Promotable'];


const KNOWLEDGE_AREAS = [
    'Project Management',
    'GESI Skills',
    'Legislative Knowledge (Cocoa Act, PSMA, General Orders, PFMA, PNG Constitution)',
    'Government Policy Familiarity',
    'International Trade & Certification',
    'Sustainability & Compliance'
];

const initialFormState: Omit<IndividualLndPlanRecord, 'id'> = {
    organizationName: '',
    division: '',
    officerName: '',
    positionNumber: '',
    designation: '',
    dateOfBirth: '',
    officerStatus: '',
    highestQualification: '',
    commencementDate: '',
    gradeLevel: '',
    trainingNeeds: {
        longTerm: [],
        shortTerm: [],
    },
    knowledgeChecklist: KNOWLEDGE_AREAS.reduce((acc, area) => ({ ...acc, [area]: false }), {}),
    otherKnowledge: [],
    ageGroup: '',
    performanceLevel: '',
    promotionPotential: '',
};

const emptyTrainingNeed: Omit<LndTrainingNeed, 'id'> = {
    perceivedArea: '',
    jobRequirement: '',
    proposedCourse: '',
    institution: '',
    fundingSource: 'Department',
    yearOfCommencement: yearOptions[0],
    remarks: '',
};

const FormField: React.FC<{ label: string, required?: boolean, children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const TrainingNeedInlineForm: React.FC<{
    onSave: (need: Omit<LndTrainingNeed, 'id'>) => void;
    onCancel: () => void;
    initialData?: Omit<LndTrainingNeed, 'id'>;
}> = ({ onSave, onCancel, initialData }) => {
    const [need, setNeed] = useState(initialData || emptyTrainingNeed);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNeed(prev => ({ ...prev, [name]: name === 'yearOfCommencement' ? (value ? Number(value) : '') : value }));
    };

    const handleSaveClick = () => {
        if (!need.jobRequirement.trim() || !need.proposedCourse.trim()) {
            alert("Job Requirement and Proposed Course are required.");
            return;
        }
        onSave(need);
    };

    return (
        <tr className="bg-slate-200 dark:bg-slate-800/50">
            <td colSpan={8} className="p-2">
                <div className="space-y-3 p-2 border border-slate-300 dark:border-slate-600 rounded-md">
                    <textarea name="jobRequirement" value={need.jobRequirement} onChange={handleInputChange} rows={2} className="w-full text-xs p-1 rounded-md" placeholder="Job Requirement Justification*" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input type="text" name="perceivedArea" value={need.perceivedArea} onChange={handleInputChange} className="w-full text-xs p-1 rounded-md" placeholder="Perceived Area of Training" />
                        <input type="text" name="proposedCourse" value={need.proposedCourse} onChange={handleInputChange} className="w-full text-xs p-1 rounded-md" placeholder="Proposed Training Course*" />
                        <input type="text" name="institution" value={need.institution} onChange={handleInputChange} className="w-full text-xs p-1 rounded-md" placeholder="Preferred Institution" />
                        <select name="fundingSource" value={need.fundingSource} onChange={handleInputChange} className="w-full text-xs p-1 rounded-md"><option value="" disabled>Funding...</option>{fundingSourceOptions.map(o=><option key={o} value={o}>{o}</option>)}</select>
                        <select name="yearOfCommencement" value={need.yearOfCommencement} onChange={handleInputChange} className="w-full text-xs p-1 rounded-md"><option value="">Year...</option>{yearOptions.map(y=><option key={y} value={y}>{y}</option>)}</select>
                    </div>
                    <textarea name="remarks" value={need.remarks} onChange={handleInputChange} rows={2} className="w-full text-xs p-1 rounded-md" placeholder="Remarks (optional)" />
                    <div className="flex gap-2">
                        <button type="button" onClick={handleSaveClick} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Save Need</button>
                        <button type="button" onClick={onCancel} className="px-3 py-1 text-xs bg-slate-500 text-white rounded hover:bg-slate-600">Cancel</button>
                    </div>
                </div>
            </td>
        </tr>
    );
};


export const IndividualLndPlanForm: React.FC<ReportProps> = ({ onClose }) => {
    const [records, setRecords] = useState<IndividualLndPlanRecord[]>([]);
    const [formState, setFormState] = useState<Omit<IndividualLndPlanRecord, 'id'>>(initialFormState);
    const [errors, setErrors] = useState<string[]>([]);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingNeed, setEditingNeed] = useState<{ category: 'longTerm' | 'shortTerm', need?: LndTrainingNeed } | null>(null);
    const [expandedSections, setExpandedSections] = useState({ longTerm: true, shortTerm: true });
    const [otherKnowledgeText, setOtherKnowledgeText] = useState('');

    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                const sanitized = parsed.map((p: any) => ({
                    ...initialFormState,
                    ...p,
                    trainingNeeds: p.trainingNeeds || { longTerm: [], shortTerm: [] },
                    knowledgeChecklist: p.knowledgeChecklist || KNOWLEDGE_AREAS.reduce((acc, area) => ({ ...acc, [area]: false }), {}),
                    otherKnowledge: p.otherKnowledge || [],
                }));
                setRecords(sanitized);
                showStatus('Loaded saved draft.', 'info');
            }
        } catch (e) {
            console.error(e);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
    }, []);
    
    // --- Suggestion Lists for Autocomplete ---
    const suggestionLists = useMemo(() => {
        const organizations = [...new Set(records.map(r => r.organizationName).filter(Boolean))].sort();
        const divisions = [...new Set(records.map(r => r.division).filter(Boolean))].sort();
        const officerNames = [...new Set(records.map(r => r.officerName).filter(Boolean))].sort();
        const designations = [...new Set(records.map(r => r.designation).filter(Boolean))].sort();
        const qualifications = [...new Set(records.map(r => r.highestQualification).filter(Boolean))].sort();
        const grades = [...new Set(records.map(r => r.gradeLevel).filter(Boolean))].sort();

        return { organizations, divisions, officerNames, designations, qualifications, grades };
    }, [records]);

    const designationSuggestions = useMemo(() => {
        if (formState.division) {
            const divisionDesignations = records
                .filter(r => r.division === formState.division)
                .map(r => r.designation)
                .filter(Boolean);
            if (divisionDesignations.length > 0) {
                return [...new Set(divisionDesignations)].sort();
            }
        }
        return suggestionLists.designations;
    }, [records, formState.division, suggestionLists.designations]);
    // --- End Suggestion Lists ---

    const showStatus = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleAutocompleteChange = (name: keyof Omit<IndividualLndPlanRecord, 'id'>, value: string) => {
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const validateForm = (): boolean => {
        setErrors([]);
        const validationErrors: string[] = [];
        if (!formState.officerName.trim()) validationErrors.push('Full Name of Officer is required.');
        if (!formState.positionNumber.trim()) validationErrors.push('Position Number is required.');
        if (records.some(r => r.positionNumber === formState.positionNumber && r.id !== editingId)) {
            validationErrors.push('Position Number must be unique.');
        }
        if (!formState.designation.trim()) validationErrors.push('Designation/Title is required.');
        if (!formState.officerStatus) validationErrors.push('Officer Status is required.');
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return false;
        }
        return true;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (editingId) {
            const updatedRecords = records.map(rec => rec.id === editingId ? { ...formState, id: editingId } : rec);
            setRecords(updatedRecords);
            showStatus('Plan updated successfully!', 'success');
        } else {
            const newRecord: IndividualLndPlanRecord = { id: crypto.randomUUID(), ...formState };
            setRecords(prev => [...prev, newRecord]);
            showStatus('New plan added successfully!', 'success');
        }
        
        setFormState(initialFormState);
        setEditingId(null);
    };
    
    const handleEdit = (record: IndividualLndPlanRecord) => {
        const recordToEdit = {
            ...initialFormState,
            ...record,
            trainingNeeds: record.trainingNeeds || { longTerm: [], shortTerm: [] },
            knowledgeChecklist: record.knowledgeChecklist || KNOWLEDGE_AREAS.reduce((acc, area) => ({ ...acc, [area]: false }), {}),
            otherKnowledge: record.otherKnowledge || [],
        };
        setFormState(recordToEdit);
        setEditingId(record.id);
        window.scrollTo(0, 0);
    };

    const handleDeleteRecord = (id: string) => {
        if (window.confirm("Are you sure you want to delete this plan?")) {
            setRecords(prev => prev.filter(r => r.id !== id));
            showStatus('Plan deleted.', 'info');
        }
    };
    
    const handleCancelEdit = () => {
        setFormState(initialFormState);
        setEditingId(null);
        setErrors([]);
    };

    const handleSaveDraft = () => {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(records));
        showStatus('Draft saved successfully!', 'success');
    };
    
    const handleSaveNeed = (category: 'longTerm' | 'shortTerm', needData: Omit<LndTrainingNeed, 'id'>) => {
        const needs = formState.trainingNeeds[category];
        const existingNeed = editingNeed?.need;
        let updatedNeeds;

        if (existingNeed) {
            updatedNeeds = needs.map(n => n.id === existingNeed.id ? { ...existingNeed, ...needData } : n);
        } else {
            const newNeed: LndTrainingNeed = { ...needData, id: crypto.randomUUID() };
            updatedNeeds = [...needs, newNeed];
        }

        setFormState(prev => ({ ...prev, trainingNeeds: { ...prev.trainingNeeds, [category]: updatedNeeds } }));
        setEditingNeed(null);
    };

    const handleDeleteNeed = (category: 'longTerm' | 'shortTerm', needId: string) => {
        if (!window.confirm("Delete this training need?")) return;
        const updatedNeeds = formState.trainingNeeds[category].filter(n => n.id !== needId);
        setFormState(prev => ({ ...prev, trainingNeeds: { ...prev.trainingNeeds, [category]: updatedNeeds } }));
    };

    const handleKnowledgeCheckboxChange = (area: string) => {
        setFormState(prev => ({
            ...prev,
            knowledgeChecklist: {
                ...prev.knowledgeChecklist,
                [area]: !prev.knowledgeChecklist[area],
            }
        }));
    };

    const handleAddOtherKnowledge = () => {
        if (otherKnowledgeText.trim() && !formState.otherKnowledge.includes(otherKnowledgeText.trim())) {
            setFormState(prev => ({
                ...prev,
                otherKnowledge: [...prev.otherKnowledge, otherKnowledgeText.trim()]
            }));
            setOtherKnowledgeText('');
        }
    };

    const handleRemoveOtherKnowledge = (area: string) => {
        setFormState(prev => ({
            ...prev,
            otherKnowledge: prev.otherKnowledge.filter(item => item !== area)
        }));
    };

    const getSingleOfficerReportData = (plan: IndividualLndPlanRecord): ReportData => {
        const allNeeds = [...(plan.trainingNeeds.longTerm || []), ...(plan.trainingNeeds.shortTerm || [])];
        const totalNeeds = allNeeds.length;
        
        const yearSummary = allNeeds.map(n => n.yearOfCommencement).filter(Boolean).reduce((acc, year) => {
            acc[year!] = (acc[year!] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
            
        const fundingSummary = allNeeds.map(n => n.fundingSource).filter(Boolean).reduce((acc, fund) => {
            acc[fund!] = (acc[fund!] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            title: `L&D Plan Summary: ${plan.officerName}`,
            sections: [
                {
                    title: "Officer Profile",
                    content: [{
                        type: 'table',
                        headers: ['Field', 'Value'],
                        rows: [
                            ['Organization', plan.organizationName || 'N/A'],
                            ['Branch/Division', plan.division || 'N/A'],
                            ['Full Name', plan.officerName],
                            ['Position Number', plan.positionNumber],
                            ['Designation/Title', plan.designation],
                            ['Date of Birth', plan.dateOfBirth || 'N/A'],
                            ['Officer Status', plan.officerStatus || 'N/A'],
                            ['Highest Qualification', plan.highestQualification || 'N/A'],
                            ['Commencement Date', plan.commencementDate || 'N/A'],
                            ['Grade Level', plan.gradeLevel || 'N/A'],
                        ]
                    }]
                },
                {
                    title: "Performance & Promotion Assessment",
                    content: [{
                        type: 'table',
                        headers: ['Indicator', 'Assessment'],
                        rows: [
                            ['Age Group', plan.ageGroup || 'N/A'],
                            ['Current Performance Level', plan.performanceLevel || 'N/A'],
                            ['Promotion Potential', plan.promotionPotential || 'N/A'],
                        ]
                    }]
                },
                {
                    title: "List of all Proposed Trainings",
                    content: [{
                        type: 'table',
                        headers: ['Category', 'Proposed Course', 'Justification', 'Year', 'Funding'],
                        rows: allNeeds.map(need => [
                            (plan.trainingNeeds.longTerm || []).find(n => n.id === need.id) ? 'Long-Term' : 'Short-Term',
                            need.proposedCourse,
                            need.jobRequirement,
                            need.yearOfCommencement || 'TBD',
                            need.fundingSource || 'TBD'
                        ])
                    }]
                },
                {
                    title: "Summary",
                    content: [{
                        type: 'table',
                        headers: ['Metric', 'Value'],
                        rows: [
                            ['Total Training Needs', totalNeeds],
                            ['Estimated Start Year Summary', Object.entries(yearSummary).map(([k, v]) => `${k}: ${v}`).join('; ') || 'N/A'],
                            ['Funding Type Summary', Object.entries(fundingSummary).map(([k, v]) => `${k}: ${v}`).join('; ') || 'N/A'],
                        ]
                    }]
                }
            ]
        };
    };

    const getBulkFlatReportData = (): ReportData => {
        const tableHeaders = ["Officer Name", "Position No.", "Designation", "Age Group", "Performance Level", "Promotion Potential", "Category", "Perceived Area", "Job Requirement", "Proposed Course", "Institution", "Funding", "Year", "Remarks", "Knowledge Competencies (Predefined)", "Knowledge Competencies (Other)"];
        const tableRows = records.flatMap((rec: IndividualLndPlanRecord) => {
            const officerInfo = [rec.officerName, rec.positionNumber, rec.designation, rec.ageGroup, rec.performanceLevel, rec.promotionPotential];
            const knowledgePredefined = Object.entries(rec.knowledgeChecklist || {}).filter(([, checked]) => checked).map(([key]) => key).join('; ');
            const knowledgeOther = (rec.otherKnowledge || []).join('; ');

            const baseRow = [...officerInfo, "", "", "", "", "", "", "", "", knowledgePredefined, knowledgeOther];

            const longTermRows = (rec.trainingNeeds?.longTerm || []).map(need => [...officerInfo, "Long-Term", need.perceivedArea, need.jobRequirement, need.proposedCourse, need.institution, need.fundingSource, need.yearOfCommencement, need.remarks, knowledgePredefined, knowledgeOther]);
            const shortTermRows = (rec.trainingNeeds?.shortTerm || []).map(need => [...officerInfo, "Short-Term", need.perceivedArea, need.jobRequirement, need.proposedCourse, need.institution, need.fundingSource, need.yearOfCommencement, need.remarks, knowledgePredefined, knowledgeOther]);
            
            const allRows = [...longTermRows, ...shortTermRows];
            
            if (Array.isArray(allRows) && allRows.length === 0) {
                return [baseRow];
            }
            return allRows;
        });
        return {
            title: "Individual L&D Plans",
            sections: [{ title: "Individual L&D Plan Records", content: [{ type: 'table', headers: tableHeaders, rows: tableRows }] }]
        };
    };

    const handleSingleExport = (plan: IndividualLndPlanRecord, format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets') => {
        try {
            const reportData = getSingleOfficerReportData(plan);
            if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'docx') exportToDocx(reportData);
            else if (format === 'xlsx') exportToXlsx(reportData);
            else showStatus('This format is best for bulk exports.', 'info');
        } catch (e) {
            console.error("Export failed:", e);
            showStatus("Could not export report.", 'error');
        }
    };
    
    const handleBulkExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets') => {
        if (records.length === 0) {
            showStatus("No plans to export.", "info");
            return;
        }

        try {
            if (format === 'csv' || format === 'sheets') {
                const reportData = getBulkFlatReportData();
                if (format === 'csv') exportToCsv(reportData);
                else copyForSheets(reportData).then(msg => showStatus(msg, 'success')).catch(err => showStatus(err, 'error'));
            } else {
                const allSections = records.flatMap(plan => {
                    const singleReport = getSingleOfficerReportData(plan);
                    return [
                        { title: `\n\nL&D Plan Summary: ${plan.officerName} (${plan.positionNumber})`, content: [""] }, 
                        ...singleReport.sections
                    ];
                });
                const bulkReportData: ReportData = {
                    title: "Bulk Export of Individual L&D Plans",
                    sections: allSections,
                };
                if (format === 'pdf') exportToPdf(bulkReportData);
                else if (format === 'docx') exportToDocx(bulkReportData);
                else if (format === 'xlsx') exportToXlsx(bulkReportData);
            }
        } catch (e) {
            console.error("Bulk export failed:", e);
            showStatus("Could not export report.", "error");
        }
    };


    const TrainingNeedsCategory: React.FC<{
        category: 'longTerm' | 'shortTerm',
        title: string,
        needs: LndTrainingNeed[],
    }> = ({ category, title, needs }) => {
        const isExpanded = expandedSections[category];
        return (
            <div className="border border-slate-300 dark:border-slate-700 rounded-md">
                <button type="button" onClick={() => setExpandedSections(p => ({...p, [category]: !p[category]}))} className="w-full flex justify-between items-center p-3 bg-slate-200/50 dark:bg-slate-900/40 font-bold text-slate-700 dark:text-slate-200">
                    {title}
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && <div className="p-3">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b-2 border-slate-300 dark:border-slate-600"><tr>{["Perceived Area", "Job Requirement", "Proposed Course", "Institution", "Funding", "Year", "Remarks", "Actions"].map(h => <th key={h} className="p-1">{h}</th>)}</tr></thead>
                            <tbody>
                                {needs.map(need => (
                                    <tr key={need.id} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="p-1">{need.perceivedArea}</td><td className="p-1">{need.jobRequirement}</td><td className="p-1">{need.proposedCourse}</td>
                                        <td className="p-1">{need.institution}</td><td className="p-1">{need.fundingSource}</td><td className="p-1">{need.yearOfCommencement}</td>
                                        <td className="p-1">{need.remarks}</td>
                                        <td className="p-1"><div className="flex gap-2">
                                            <button type="button" onClick={() => setEditingNeed({ category, need })} className="p-1 text-slate-500 hover:text-blue-600"><PencilIcon className="w-3 h-3"/></button>
                                            <button type="button" onClick={() => handleDeleteNeed(category, need.id)} className="p-1 text-slate-500 hover:text-red-600"><TrashIcon className="w-3 h-3"/></button>
                                        </div></td>
                                    </tr>
                                ))}
                                {editingNeed?.category === category && <TrainingNeedInlineForm onSave={(data) => handleSaveNeed(category, data)} onCancel={() => setEditingNeed(null)} initialData={editingNeed.need ? (({ id, ...rest }) => rest)(editingNeed.need) : undefined} />}
                            </tbody>
                        </table>
                    </div>
                    {!editingNeed && <button type="button" onClick={() => setEditingNeed({ category })} className="mt-2 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+ Add Need</button>}
                </div>}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <IdentificationIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Individual Learning & Development Plan (202X–202X)</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close form">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6 relative space-y-6">
                     {statusMessage && (
                        <div className={`sticky top-0 p-3 rounded-lg text-sm font-semibold shadow-lg animate-fade-in-out z-20 ${
                            statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 
                            statusMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {statusMessage.text}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold border-b pb-2">{editingId ? `Editing Plan for ${formState.officerName}` : "Section 1: Officer Details"}</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField label="🏢 Organization Name"><AutocompleteInput name="organizationName" value={formState.organizationName} onChange={(v) => handleAutocompleteChange('organizationName', v)} suggestions={suggestionLists.organizations} /></FormField>
                            <FormField label="📍 Branch/Division/Dept"><AutocompleteInput name="division" value={formState.division} onChange={(v) => handleAutocompleteChange('division', v)} suggestions={suggestionLists.divisions} /></FormField>
                            <FormField label="👤 Full Name of Officer" required><AutocompleteInput name="officerName" value={formState.officerName} onChange={(v) => handleAutocompleteChange('officerName', v)} suggestions={suggestionLists.officerNames} required /></FormField>
                            <FormField label="🆔 Position Number" required><input type="text" name="positionNumber" value={formState.positionNumber} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" /></FormField>
                            <FormField label="🧑 Designation/Title" required><AutocompleteInput name="designation" value={formState.designation} onChange={(v) => handleAutocompleteChange('designation', v)} suggestions={designationSuggestions} required /></FormField>
                            <FormField label="🗓 Date of Birth"><input type="date" name="dateOfBirth" value={formState.dateOfBirth} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" /></FormField>
                            <FormField label="🧾 Officer Status" required><select name="officerStatus" value={formState.officerStatus} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"><option value="" disabled>Select...</option>{officerStatusOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></FormField>
                            <FormField label="🎓 Highest Qualification"><AutocompleteInput name="highestQualification" value={formState.highestQualification} onChange={(v) => handleAutocompleteChange('highestQualification', v)} suggestions={suggestionLists.qualifications} /></FormField>
                            <FormField label="📅 Commencement Date"><input type="date" name="commencementDate" value={formState.commencementDate} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" /></FormField>
                            <FormField label="📦 Current Grade Level (Optional)"><AutocompleteInput name="gradeLevel" value={formState.gradeLevel} onChange={(v) => handleAutocompleteChange('gradeLevel', v)} suggestions={suggestionLists.grades} /></FormField>
                        </div>
                        
                         <div className="pt-4">
                            <h3 className="text-xl font-bold border-b pb-2">Performance & Promotion Assessment</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                <FormField label="🎂 Age Group">
                                    <select name="ageGroup" value={formState.ageGroup} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">
                                        <option value="" disabled>Select...</option>
                                        {ageGroupOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="📈 Current Performance Level">
                                    <select name="performanceLevel" value={formState.performanceLevel} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">
                                        <option value="" disabled>Select...</option>
                                        {performanceLevelOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="🪜 Promotion Potential">
                                     <select name="promotionPotential" value={formState.promotionPotential} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">
                                        <option value="" disabled>Select...</option>
                                        {promotionPotentialOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </FormField>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                             <h3 className="text-xl font-bold border-b pb-2">Section 2: Learning and Development Needs</h3>
                             <TrainingNeedsCategory category="longTerm" title="Long-Term Training (Qualifications & Experience)" needs={formState.trainingNeeds.longTerm} />
                             <TrainingNeedsCategory category="shortTerm" title="Short-Term Training (Skills & Knowledge)" needs={formState.trainingNeeds.shortTerm} />
                        </div>
                        
                        <div className="pt-4 space-y-4">
                             <h3 className="text-xl font-bold border-b pb-2">Section 3: Desired Knowledge Competencies</h3>
                             <FormField label="Select applicable knowledge areas">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                     {KNOWLEDGE_AREAS.map(area => (
                                         <label key={area} className="flex items-center gap-2 text-sm">
                                             <input
                                                 type="checkbox"
                                                 checked={formState.knowledgeChecklist[area] || false}
                                                 onChange={() => handleKnowledgeCheckboxChange(area)}
                                                 className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                             />
                                             {area}
                                         </label>
                                     ))}
                                 </div>
                             </FormField>
                             <FormField label="Other knowledge areas">
                                 <div className="flex items-center gap-2">
                                     <input
                                         type="text"
                                         value={otherKnowledgeText}
                                         onChange={(e) => setOtherKnowledgeText(e.target.value)}
                                         placeholder="Add another knowledge area"
                                         className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"
                                     />
                                     <button type="button" onClick={handleAddOtherKnowledge} className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700">Add</button>
                                 </div>
                                 {formState.otherKnowledge.length > 0 && (
                                     <div className="flex flex-wrap gap-2 mt-2">
                                         {formState.otherKnowledge.map(area => (
                                             <span key={area} className="flex items-center gap-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                                                 {area}
                                                 <button type="button" onClick={() => handleRemoveOtherKnowledge(area)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                                                     <XIcon className="w-3 h-3"/>
                                                 </button>
                                             </span>
                                         ))}
                                     </div>
                                 )}
                             </FormField>
                        </div>

                        {errors.length > 0 && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm"><ul>{errors.map((err, i) => <li key={i}>{err}</li>)}</ul></div>}
                        <div className="flex gap-2 pt-4 border-t mt-4">
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">{editingId ? "Update Plan" : "Add Plan"}</button>
                            {editingId && <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-slate-500 text-white font-semibold rounded-md hover:bg-slate-600">Cancel Edit</button>}
                        </div>
                    </form>

                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Saved Plans ({records.length})</h3>
                             <div className="flex gap-2">
                                <button onClick={handleSaveDraft} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 rounded-md"><SaveIcon className="w-4 h-4" /> Save Draft</button>
                                <ExportMenu onExport={handleBulkExport} />
                            </div>
                        </div>
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0"><tr>{["Officer", "Position", "Status", "Actions"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
                                <tbody>
                                    {records.map(rec => (
                                        <tr key={rec.id} className="border-b border-slate-200 dark:border-slate-700">
                                            <td className="p-2 font-semibold">{rec.officerName}</td>
                                            <td className="p-2">{rec.designation} ({rec.positionNumber})</td>
                                            <td className="p-2">{rec.officerStatus}</td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEdit(rec)} className="p-1 text-slate-500 hover:text-blue-600" aria-label={`Edit plan for ${rec.officerName}`}><PencilIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteRecord(rec.id)} className="p-1 text-slate-500 hover:text-red-600" aria-label={`Delete plan for ${rec.officerName}`}><TrashIcon className="w-4 h-4" /></button>
                                                    <ExportMenu onExport={(format) => handleSingleExport(rec, format as any)} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {records.length === 0 && <div className="text-center p-8 text-slate-500">No plans created yet.</div>}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};
