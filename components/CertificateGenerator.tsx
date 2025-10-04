import React, { useState } from 'react';
import { XIcon, DocumentIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, ReportData } from '../utils/export';

interface ReportProps {
  onClose: () => void;
}

const FloralCorner: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={`absolute w-24 h-24 text-black ${className}`} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,0 C80,0 100,20 100,50 L100,100 L50,100 C20,100 0,80 0,50 L0,0 L50,0 Z" transform="translate(0,0) scale(0.1)" />
        <path d="M40 5 C51.5 12 59.5 24.5 60 40 C59.5 55.5 51.5 68 40 75 C28.5 68 20.5 55.5 20 40 C20.5 24.5 28.5 12 40 5 Z" transform="translate(10,10) rotate(45) scale(0.3)" />
        <path d="M20,10 C30,15 35,25 30,35 L10,20 C15,15 15,10 20,10 Z" transform="translate(5, 40) rotate(-30) scale(0.5)" />
        <path d="M10,20 C15,30 25,35 35,30 L20,10 C15,15 10,15 10,20 Z" transform="translate(40, 5) rotate(-30) scale(0.5)" />
    </svg>
);

const BlueGoldSeal: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="blueSealGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{ stopColor: '#2563EB' }} />
                <stop offset="100%" style={{ stopColor: '#1E40AF' }} />
            </radialGradient>
            <filter id="sealShine">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                <feOffset in="blur" dx="2" dy="2" result="offsetBlur" />
                <feSpecularLighting in="blur" surfaceScale="5" specularConstant=".75" specularExponent="20" lightingColor="#FFF" result="specOut">
                    <fePointLight x="-5000" y="-10000" z="20000" />
                </feSpecularLighting>
                <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
                <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
            </filter>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#B8860B" />
        <circle cx="50" cy="50" r="45" fill="url(#blueSealGradient)" filter="url(#sealShine)" />
        <text x="50" y="58" textAnchor="middle" fill="#FFD700" fontSize="14" fontWeight="bold" fontFamily="serif">DPM</text>
    </svg>
);


export const CertificateGenerator: React.FC<ReportProps> = ({ onClose }) => {
    const [recipientName, setRecipientName] = useState("Department of Personnel Management");
    const [certificateType, setCertificateType] = useState("OF COMPLIANCE");
    const [descriptionText, setDescriptionText] = useState("has successfully completed the CNA for the Assessment Period 2025.");
    const [signature1Name, setSignature1Name] = useState("Taies Sansan");
    const [signature1Title, setSignature1Title] = useState("Secretary, DPM");
    const [signature2Name, setSignature2Name] = useState("First Assistant Secretary");
    const [signature2Title, setSignature2Title] = useState("Corporate Services");

    const getReportDataForExport = (): ReportData => {
        return {
            title: `Certificate ${certificateType} for ${recipientName}`,
            sections: [
                {
                    title: `CERTIFICATE ${certificateType}`,
                    content: [
                        `This certificate is proudly presented to`,
                        `\n${recipientName}\n`,
                        descriptionText,
                        `\n\nSignatory 1: ${signature1Name}, ${signature1Title}`,
                        `Signatory 2: ${signature2Name}, ${signature2Title}`
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
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Certificate of Compliance Generator</h1>
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
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Certificate Subtitle</label>
                                <input type="text" value={certificateType} onChange={(e) => setCertificateType(e.target.value)} className="mt-1 w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Recipient Agency Name</label>
                                <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="mt-1 w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Compliance Statement</label>
                                <textarea value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} rows={4} className="mt-1 w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Signature 1 Name</label>
                                    <input type="text" value={signature1Name} onChange={(e) => setSignature1Name(e.target.value)} className="mt-1 w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Signature 1 Title</label>
                                    <input type="text" value={signature1Title} onChange={(e) => setSignature1Title(e.target.value)} className="mt-1 w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Signature 2 Name</label>
                                    <input type="text" value={signature2Name} onChange={(e) => setSignature2Name(e.target.value)} className="mt-1 w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Signature 2 Title</label>
                                    <input type="text" value={signature2Title} onChange={(e) => setSignature2Title(e.target.value)} className="mt-1 w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-2/3 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-lg p-4">
                        <div id="certificate-content" className="bg-white text-slate-800 w-full aspect-[1.414/1] p-4 border-[12px] border-blue-800 relative flex flex-col font-['Times_New_Roman',_serif]">
                            {/* Floral Corners */}
                            <FloralCorner className="top-1 left-1" />
                            <FloralCorner className="top-1 right-1 transform scale-x-[-1]" />
                            <FloralCorner className="bottom-1 left-1 transform scale-y-[-1]" />
                            <FloralCorner className="bottom-1 right-1 transform scale-[-1]" />
                            
                            <div className="relative z-10 flex flex-col items-center justify-between flex-grow text-center p-8">
                                <div className="w-full">
                                    <h1 className="text-5xl font-bold text-blue-800 tracking-widest">CERTIFICATE</h1>
                                    <p className="mt-2 text-2xl font-semibold tracking-wider" style={{ color: '#DAA520' }}>{certificateType}</p>
                                </div>
                                
                                <div className="w-full">
                                    <div className="w-3/4 h-px bg-yellow-500 mx-auto my-4"></div>
                                    <p className="text-md italic text-slate-700">This certificate is proudly presented to</p>
                                </div>
                                
                                <div className="my-4">
                                    <p style={{fontFamily: "'Times New Roman', serif", color: '#DAA520'}} className="text-5xl font-bold">{recipientName}</p>
                                </div>

                                <div className="w-full max-w-lg">
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        {descriptionText}
                                    </p>
                                </div>
                                
                                <div className="w-full mt-auto pt-8 flex items-end justify-center">
                                    <BlueGoldSeal className="w-24 h-24 absolute bottom-8 left-1/2 -translate-x-1/2" />
                                    <div className="w-full flex justify-between">
                                        <div className="text-center w-2/5">
                                            <div className="border-b-2 border-slate-600 w-full mb-1 h-12"></div>
                                            <p className="text-xs font-semibold">{signature1Name}</p>
                                            <p className="text-xs">{signature1Title}</p>
                                        </div>
                                        <div className="text-center w-2/5">
                                             <div className="border-b-2 border-slate-600 w-full mb-1 h-12"></div>
                                            <p className="text-xs font-semibold">{signature2Name}</p>
                                            <p className="text-xs">{signature2Title}</p>
                                        </div>
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