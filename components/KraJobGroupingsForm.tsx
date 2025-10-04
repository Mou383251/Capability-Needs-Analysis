import React, { useState, useEffect, useMemo } from 'react';
import { ThematicProgrammeArea, KraThematicMapping, OrgStructure } from '../types';
import { KRA_DATA, ORG_STRUCTURE_ITEMS } from '../data/kra';
import { XIcon, PresentationChartLineIcon, SaveIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToCsv, copyForSheets, ReportData } from '../utils/export';

interface ReportProps {
    onClose: () => void;
}

const DRAFT_STORAGE_KEY = 'cna_kra_thematic_mappings_draft';

export const KraJobGroupingsForm: React.FC<ReportProps> = ({ onClose }) => {
    const [mappings, setMappings] = useState<KraThematicMapping[]>([]);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);

    const thematicAreaOptions = useMemo(() => {
        return [...new Set(KRA_DATA.map(k => k.thematicProgrammeArea))];
    }, []);

    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const draftMappings: KraThematicMapping[] = JSON.parse(savedDraft);
                // Ensure all org structures are present, even if new ones were added to the code
                const completeMappings = ORG_STRUCTURE_ITEMS.map(orgStructure => {
                    const savedMapping = draftMappings.find(m => m.orgStructure === orgStructure);
                    return savedMapping || ({ orgStructure, thematicProgrammeArea: '' } as KraThematicMapping);
                });
                setMappings(completeMappings);
                showStatus('Loaded saved draft.', 'info');
            } catch (e) {
                console.error("Failed to parse KRA thematic mappings draft:", e);
                initializeMappings();
            }
        } else {
            initializeMappings();
        }
    }, []);

    const initializeMappings = () => {
        setMappings(ORG_STRUCTURE_ITEMS.map(orgStructure => ({
            orgStructure,
            thematicProgrammeArea: ''
        })));
    };

    const showStatus = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleMappingChange = (orgStructure: OrgStructure, thematicArea: ThematicProgrammeArea | '') => {
        setMappings(prev => prev.map(m =>
            m.orgStructure === orgStructure ? { ...m, thematicProgrammeArea: thematicArea } : m
        ));
    };

    const handleSaveDraft = () => {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(mappings));
        showStatus('Changes saved successfully!', 'success');
    };

    const getReportDataForExport = (): ReportData => {
        const tableHeaders = ["Thematic Programme Area", "KRA (Org Structure)"];
        const tableRows = mappings.map(m => [m.thematicProgrammeArea, m.orgStructure]);
        return {
            title: 'KRA Thematic Groupings',
            sections: [{ title: 'KRA Thematic Groupings', content: [{ type: 'table', headers: tableHeaders, rows: tableRows }] }]
        };
    };

    const handleExport = (format: 'csv' | 'sheets') => {
        const reportData = getReportDataForExport();
        if (format === 'csv') exportToCsv(reportData);
        else if (format === 'sheets') copyForSheets(reportData).then(msg => showStatus(msg, 'success')).catch(err => showStatus(err, 'error'));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <PresentationChartLineIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KRA Thematic Groupings</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close form">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6 relative">
                    {statusMessage && (
                        <div className={`absolute top-4 right-6 p-3 rounded-lg text-sm font-semibold shadow-lg animate-fade-in-out z-20 ${
                            statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {statusMessage.text}
                        </div>
                    )}
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            Assign a Thematic Programme Area to each organizational structure or job grouping. This mapping helps categorize strategic staffing needs.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-200 dark:bg-slate-700/50 text-xs uppercase text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="p-2 font-semibold w-1/2">KRA (Org Structure)</th>
                                        <th className="p-2 font-semibold w-1/2">Thematic Programme Area</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mappings.map(mapping => (
                                        <tr key={mapping.orgStructure} className="border-b border-slate-200 dark:border-slate-700">
                                            <td className="p-2 font-semibold align-middle">{mapping.orgStructure}</td>
                                            <td className="p-2 align-middle">
                                                <select
                                                    value={mapping.thematicProgrammeArea}
                                                    onChange={(e) => handleMappingChange(mapping.orgStructure, e.target.value as ThematicProgrammeArea | '')}
                                                    className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                                                >
                                                    <option value="">-- Select Area --</option>
                                                    {thematicAreaOptions.map(area => <option key={area} value={area}>{area}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4">
                            <button onClick={handleSaveDraft} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                <SaveIcon className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
