import React, { useState, useCallback } from 'react';
import { OfficerRecord, EstablishmentRecord, AgencyType } from '../types';
import { parseCnaFile, parsePastedData, parseEstablishmentFile, EstablishmentFileSummary } from '../utils/import';
import { XIcon, DocumentArrowUpIcon, ClipboardDocumentListIcon, BuildingOfficeIcon } from './icons';

interface ImportModalProps {
    onImport: (data: OfficerRecord[], agencyType: AgencyType, agencyName: string, establishmentData?: EstablishmentRecord[]) => void;
    onClose: () => void;
}

type ImportMode = 'upload' | 'paste';

const agencyTypes: AgencyType[] = ["National Agency", "National Department", "Provincial Administration", "Provincial Health Authority", "Local Level Government", "Other"];

const PreviewTable: React.FC<{ headers: string[], data: any[] }> = ({ headers, data }) => (
    <div className="overflow-auto border border-slate-300 dark:border-slate-600 rounded-lg">
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0 z-10">
                <tr>
                    {headers.map(header => <th key={header} className="p-2 truncate font-semibold">{header}</th>)}
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {headers.map(header => <td key={`${rowIndex}-${header}`} className="p-2 truncate">{String(row[header] ?? '')}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ElementType, children: React.ReactNode }> = ({ active, onClick, icon: Icon, children }) => (
    <button
        onClick={onClick}
        role="tab"
        aria-selected={active}
        className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors ${
            active 
            ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
    >
        <Icon className="w-5 h-5" />
        {children}
    </button>
);


export const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
    const [mode, setMode] = useState<ImportMode>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const [pastedText, setPastedText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const [parsedData, setParsedData] = useState<OfficerRecord[] | null>(null);
    const [previewData, setPreviewData] = useState<any[] | null>(null);
    const [previewHeaders, setPreviewHeaders] = useState<string[] | null>(null);

    // New state for organization info
    const [agencyType, setAgencyType] = useState<AgencyType>('National Department');
    const [agencyName, setAgencyName] = useState('');
    const [establishmentFile, setEstablishmentFile] = useState<File | null>(null);
    const [establishmentSummary, setEstablishmentSummary] = useState<EstablishmentFileSummary | null>(null);
    const [parsedEstablishmentData, setParsedEstablishmentData] = useState<EstablishmentRecord[] | null>(null);


    const resetState = () => {
        setError(null);
        setLoading(false);
        setParsedData(null);
        setPreviewData(null);
        setPreviewHeaders(null);
        setFile(null);
        setPastedText('');
        setAgencyType('National Department');
        setAgencyName('');
        setEstablishmentFile(null);
        setEstablishmentSummary(null);
        setParsedEstablishmentData(null);
    };

    const handleSwitchMode = (newMode: ImportMode) => {
        if (mode !== newMode) {
            setMode(newMode);
        }
    };
    
    const processData = async (promise: Promise<{ data: OfficerRecord[], preview: any[], headers: string[] }>) => {
        setError(null);
        setLoading(true);
        setParsedData(null);
        setPreviewData(null);
        setPreviewHeaders(null);

        try {
            const { data, preview, headers } = await promise;
            setParsedData(data);
            setPreviewData(preview);
            setPreviewHeaders(headers);
        } catch (err: any) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    const handleFileSelected = (selectedFile: File | null) => {
        if (!selectedFile) return;
        
        if (!/\.(xlsx|csv|pdf)$/i.test(selectedFile.name)) {
            setError('Invalid file type. Please upload a .xlsx, .csv, or .pdf file.');
            return;
        }
        setFile(selectedFile);
        processData(parseCnaFile(selectedFile, agencyType));
    };

    const handleEstablishmentFileSelected = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        
        if (!/\.(xlsx|csv|pdf)$/i.test(selectedFile.name)) {
            setError('Invalid establishment file type. Please upload a .xlsx, .csv, or .pdf file.');
            return;
        }
        
        setError(null);
        setLoading(true);
        setEstablishmentFile(selectedFile);
        
        try {
            const { data, summary } = await parseEstablishmentFile(selectedFile, agencyType);
            setParsedEstablishmentData(data);
            setEstablishmentSummary(summary);
            // Auto-fill agency name from file name if not already set
            if (!agencyName) {
                setAgencyName(selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' '));
            }
        } catch (err: any) {
            setError(err instanceof Error ? err.message : String(err));
            setEstablishmentFile(null);
            setParsedEstablishmentData(null);
            setEstablishmentSummary(null);
        } finally {
            setLoading(false);
        }
    };


    const handleParsePastedData = () => {
        if (!pastedText) {
            setError("The text area is empty. Please paste your data.");
            return;
        }
        processData(parsePastedData(pastedText, agencyType));
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelected(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleConfirmImport = () => {
        if (parsedData && agencyName.trim() && agencyType) {
            onImport(parsedData, agencyType, agencyName.trim(), parsedEstablishmentData ?? undefined);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Import CNA Data</h1>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close import dialog">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                
                <main className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
                    <fieldset className="space-y-4 p-4 border border-slate-300 dark:border-slate-600 rounded-lg">
                        <legend className="text-md font-bold px-2 text-slate-800 dark:text-slate-100">Step 1: Identify Your Organization</legend>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Please select your category, then either type your agency’s name or upload the organization’s establishment file.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="agency-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                                <select id="agency-type" value={agencyType} onChange={e => setAgencyType(e.target.value as AgencyType)} className="mt-1 block w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                    {agencyTypes.filter(t => t !== 'All Agencies').map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="agency-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Agency Name</label>
                                <input type="text" id="agency-name" value={agencyName} onChange={e => setAgencyName(e.target.value)} required className="mt-1 block w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" placeholder="e.g., Department of Personnel Management" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Upload Establishment File (Optional)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <BuildingOfficeIcon className="mx-auto h-12 w-12 text-slate-400" />
                                    <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                        <label htmlFor="establishment-file-upload" className="relative cursor-pointer bg-white dark:bg-slate-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                                            <span>Upload a file</span>
                                            <input id="establishment-file-upload" name="establishment-file-upload" type="file" className="sr-only" accept=".xlsx, .csv, .pdf" onChange={e => handleEstablishmentFileSelected(e.target.files ? e.target.files[0] : null)} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-slate-500">XLSX, CSV, PDF up to 5MB</p>
                                </div>
                            </div>
                            {establishmentFile && !establishmentSummary && <p className="mt-2 text-xs text-yellow-600">Processing file...</p>}
                            {establishmentSummary && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md text-sm text-green-800 dark:text-green-200">
                                    <p className="font-bold">Establishment Summary:</p>
                                    <ul className="list-disc list-inside text-xs mt-1">
                                        <li>Total Positions: <strong>{establishmentSummary.totalPositions}</strong> ({establishmentSummary.vacantCount} vacant)</li>
                                        <li>Divisions Found: <strong>{establishmentSummary.divisions.length}</strong></li>
                                        <li>Level Breakdown: {Object.entries(establishmentSummary.levelSummary).map(([key, value]) => `${key}: ${value}`).join(', ')}</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </fieldset>
                    
                    <fieldset className="space-y-4 p-4 border border-slate-300 dark:border-slate-600 rounded-lg">
                        <legend className="text-md font-bold px-2 text-slate-800 dark:text-slate-100">Step 2: Provide CNA Data</legend>
                        <div className="border-b border-slate-200 dark:border-slate-700 flex">
                            <TabButton active={mode === 'upload'} onClick={() => handleSwitchMode('upload')} icon={DocumentArrowUpIcon}>Upload File</TabButton>
                            <TabButton active={mode === 'paste'} onClick={() => handleSwitchMode('paste')} icon={ClipboardDocumentListIcon}>Paste Data</TabButton>
                        </div>

                        {mode === 'upload' && (
                            <div 
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}
                            >
                                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-slate-400" />
                                <label htmlFor="file-upload" className="relative cursor-pointer">
                                    <span className="mt-2 block text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        {file ? 'Select another file' : 'Upload a file'}
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500"> or drag and drop</span>
                                </label>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx, .csv, .pdf" onChange={e => handleFileSelected(e.target.files ? e.target.files[0] : null)} />
                                <p className="mt-1 text-xs text-slate-500">XLSX, CSV, or PDF up to 10MB</p>
                                {file && <div className="mt-2 text-xs text-slate-700 dark:text-slate-300"><strong>Selected:</strong> {file.name}</div>}
                            </div>
                        )}
                        
                        {mode === 'paste' && (
                            <div className="space-y-3">
                                <p className="text-sm text-slate-600 dark:text-slate-400">Copy a range of cells from your spreadsheet (including headers) and paste it below.</p>
                                <textarea
                                    value={pastedText}
                                    onChange={(e) => setPastedText(e.target.value)}
                                    placeholder="Paste data from Excel, Google Sheets, etc."
                                    className="w-full h-32 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                ></textarea>
                                <button onClick={handleParsePastedData} className="w-full px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 disabled:bg-slate-400" disabled={loading}>
                                    Parse Pasted Data
                                </button>
                            </div>
                        )}

                        {loading && <p className="text-sm text-center text-slate-600 dark:text-slate-400">Parsing data... This may take a moment for PDF files.</p>}
                        {error && <p className="text-sm text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-3 rounded-md">{error}</p>}
                        
                        {previewData && previewHeaders && parsedData && (
                            <div className="space-y-3 flex flex-col min-h-0">
                                <p className="text-sm text-green-700 dark:text-green-300 font-semibold">
                                    CNA data parsed successfully! Found {parsedData.length} valid records.
                                </p>
                                <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">CNA Data Preview:</h3>
                                <div className="flex-1 overflow-y-auto">
                                    <PreviewTable headers={previewHeaders} data={previewData} />
                                </div>
                                {parsedData.length > previewData.length && (
                                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 italic pt-2">
                                        Preview limited to {previewData.length} rows. Full data processed in backend.
                                    </p>
                                )}
                            </div>
                        )}
                    </fieldset>
                </main>

                <footer className="flex justify-end gap-3 p-4 bg-slate-200/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmImport}
                        disabled={!parsedData || !agencyName.trim() || loading}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Confirm Import
                    </button>
                </footer>
            </div>
        </div>
    );
};
