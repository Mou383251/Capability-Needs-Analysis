import React, { useState } from 'react';
import { ArrowDownTrayIcon, DocumentIcon, TableCellsIcon, ClipboardIcon } from './icons';

interface ExportMenuProps {
    onExport: (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets' | 'json') => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onExport }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copySuccessMessage, setCopySuccessMessage] = useState('');

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets' | 'json') => {
        onExport(format);
        setIsOpen(false);
    };

    const handleCopy = () => {
        onExport('sheets');
        setIsOpen(false);
        setCopySuccessMessage('Copied to clipboard!');
        setTimeout(() => setCopySuccessMessage(''), 2000);
    }

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900"
                    id="menu-button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>{copySuccessMessage ? copySuccessMessage : 'Export'}</span>
                </button>
            </div>
            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        <button
                            onClick={handleCopy}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            role="menuitem"
                        >
                            <ClipboardIcon className="w-5 h-5 text-amber-600" />
                            <span>Copy for Sheets</span>
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            role="menuitem"
                        >
                             <TableCellsIcon className="w-5 h-5 text-gray-500" />
                             <span>Download CSV</span>
                        </button>
                         <div className="border-t my-1 border-slate-200 dark:border-slate-700"></div>
                        <button
                            onClick={() => handleExport('json')}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            role="menuitem"
                        >
                            <DocumentIcon className="w-5 h-5 text-gray-500" />
                            <span>Download JSON</span>
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            role="menuitem"
                        >
                            <DocumentIcon className="w-5 h-5 text-red-500" />
                            <span>Download PDF</span>
                        </button>
                         <button
                            onClick={() => handleExport('docx')}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            role="menuitem"
                        >
                            <DocumentIcon className="w-5 h-5 text-blue-500" />
                            <span>Download Word</span>
                        </button>
                        <button
                            onClick={() => handleExport('xlsx')}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            role="menuitem"
                        >
                             <TableCellsIcon className="w-5 h-5 text-green-600" />
                             <span>Download Excel</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};