import React, { useState } from 'react';
import { XIcon, DocumentIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, ReportData } from '../utils/export';

interface ReportProps {
  onClose: () => void;
}

const GoldenSeal: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="goldSealGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{ stopColor: '#FFD700' }} />
                <stop offset="80%" style={{ stopColor: '#DAA520' }} />
                <stop offset="100%" style={{ stopColor: '#B8860B' }} />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#goldSealGradient)" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#B8860B" strokeWidth="2" />
        <text x="50" y="55" textAnchor="middle" fill="#8B4513" fontSize="12" fontWeight="bold">SEAL</text>
    </svg>
);

// New component for the corner design
const CornerOrnament: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`absolute w-24 h-24 ${className}`}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <g opacity="0.8">
                <path d="M0 60 C30 60 30 30 60 0" stroke="#0D3B66" strokeWidth="4" fill="none" />
                <path d="M0 80 C40 80 40 40 80 0" stroke="#0D3B66" strokeWidth="1.5" fill="none" />
                <path d="M40 0 C40 20 20 20 0 40" stroke="#FFD700" strokeWidth="3" fill="none" />
                <path d="M20 0 C20 10 10 10 0 20" stroke="#FFD700" strokeWidth="1.5" fill="none" />
            </g>
        </svg>
    </div>
);


export const ProfessionalCertificate: React.FC<ReportProps> = ({ onClose }) => {
    const [recipientName, setRecipientName] = useState("Jane Doe");
    const [bodyText, setBodyText] = useState("has successfully completed the Advanced Leadership Program, demonstrating exceptional skill and dedication. This achievement recognizes their commitment to excellence and professional growth within the public service.");
    const issuanceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const getReportDataForExport = (): ReportData => {
        return {
            title: `Certificate of Achievement for ${recipientName}`,
            sections: [
                {
                    title: 'Certificate of Achievement',
                    content: [
                        `This certificate is proudly awarded to`,
                        `\n${recipientName}\n`,
                        bodyText,
                        `\nDate of Issuance: ${issuanceDate}`
                    ]
                }
            ]
        };
    };

    const handleExport = (format: 'pdf' | 'docx') => {
        const reportData = getReportDataForExport();
        if (format === 'pdf') exportToPdf(reportData);
        else if (format === 'docx') exportToDocx(reportData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full flex flex-col max-h-[90vh]">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <DocumentIcon className="w-6 h-6 text-amber-600" />
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Generate Certificate of Achievement</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={(format) => handleExport(format as 'pdf' | 'docx')} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6 flex-grow lg:flex lg:gap-6">
                    <div className="lg:w-1/3 mb-6 lg:mb-0">
                        <h2 className="text-lg font-semibold mb-3">Customize Certificate</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="recipientName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Recipient Name</label>
                                <input
                                    type="text"
                                    id="recipientName"
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    className="mt-1 w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="bodyText" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Body Text</label>
                                <textarea
                                    id="bodyText"
                                    value={bodyText}
                                    onChange={(e) => setBodyText(e.target.value)}
                                    rows={4}
                                    className="mt-1 w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-2/3 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-lg p-4">
                        <div id="certificate-content" className="bg-white text-slate-800 w-full aspect-[1.414/1] p-12 relative flex flex-col font-['Georgia',_serif]">
                            {/* Decorative Background Shapes */}
                            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 0 300 C 100 200, 200 400, 300 300 S 500 100, 600 200" stroke="#E5E7EB" fill="none" strokeWidth="2" />
                                <path d="M 800 50 C 700 150, 600 -50, 500 50 S 300 250, 200 150" stroke="#E5E7EB" fill="none" strokeWidth="1" />
                            </svg>

                            {/* NEW Four Corner Ornaments */}
                            <CornerOrnament className="top-4 left-4" />
                            <CornerOrnament className="top-4 right-4 transform scale-x-[-1]" />
                            <CornerOrnament className="bottom-4 left-4 transform scale-y-[-1]" />
                            <CornerOrnament className="bottom-4 right-4 transform scale-[-1]" />
                            
                            <div className="relative z-10 flex flex-col items-center justify-between flex-grow text-center">
                                
                                <div className="w-full">
                                    <h1 className="text-5xl font-bold text-slate-900 tracking-wide">Certificate of Achievement</h1>
                                    <p className="mt-6 text-lg text-slate-600">This certificate is proudly awarded to</p>
                                </div>
                                
                                <div className="my-8">
                                    <p style={{fontFamily: "'Brush Script MT', cursive"}} className="text-6xl text-slate-800">{recipientName || "Recipient Name"}</p>
                                </div>

                                <div className="w-full max-w-2xl">
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        {bodyText || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."}
                                    </p>
                                </div>
                                
                                <div className="w-full mt-auto pt-12 flex items-end justify-between">
                                    <div className="text-center w-1/3">
                                        <div className="mb-1 h-12">
                                            {/* Intentionally blank space for manual signature */}
                                        </div>
                                        <div className="border-b-2 border-slate-400 w-full"></div>
                                        <p className="text-xs mt-2 uppercase tracking-widest">Taies Sansan, Secretary</p>
                                    </div>
                                    <div className="w-1/3 flex justify-center">
                                         <GoldenSeal className="w-24 h-24" />
                                    </div>
                                    <div className="text-center w-1/3">
                                         <div className="border-b-2 border-slate-400 w-full mb-1 h-12"></div>
                                        <p className="text-xs mt-2 uppercase tracking-widest">SIGNATURE</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};