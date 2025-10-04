import React, { useState } from 'react';
import { XIcon, DocumentIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, ReportData } from '../utils/export';

interface ReportProps {
  agencyName: string;
  onClose: () => void;
}

export const CertificateOfCompliance: React.FC<ReportProps> = ({ agencyName, onClose }) => {
    const [assessmentDate, setAssessmentDate] = useState(new Date().getFullYear().toString());
    const issuanceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const complianceStatement = `This is to certify that ${agencyName} has successfully completed the Capability Needs Analysis (CNA) for the assessment period of ${assessmentDate}. The agency has fulfilled the requirements set forth by the Department of Personnel Management for assessing workforce capabilities and identifying strategic training needs. This certificate acknowledges the agency's commitment to continuous improvement and strategic human resource development in alignment with the goals of the Papua New Guinea Public Service.`;

    const getReportDataForExport = (): ReportData => {
        return {
            title: 'Certificate of Compliance',
            sections: [
                {
                    title: 'Certificate of Compliance',
                    content: [
                        `Issuing Authority: Department of Personnel Management (DPM)`,
                        `Recipient Agency: ${agencyName}`,
                        `Date of Issuance: ${issuanceDate}`,
                        `\nAssessment Details:\n` +
                        `- Assessment Type: Capability Needs Analysis (CNA)\n` +
                        `- Assessment Conducted By: DPM’s Capacity Building Team\n` +
                        `- Assessment Date / Period: ${assessmentDate}`,
                        `\nCompliance Statement:\n${complianceStatement}`
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
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <DocumentIcon className="w-6 h-6 text-amber-600" />
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Generate Certificate of Compliance</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={(format) => handleExport(format as 'pdf' | 'docx')} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">
                    <div className="mb-4">
                        <label htmlFor="assessmentDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assessment Date / Period</label>
                        <input
                            type="text"
                            id="assessmentDate"
                            value={assessmentDate}
                            onChange={(e) => setAssessmentDate(e.target.value)}
                            placeholder="e.g., 2024-2025 or Q4 2024"
                            className="mt-1 w-full max-w-xs p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                        />
                    </div>

                    <div id="certificate-content" className="bg-white dark:bg-slate-800 p-8 border-4 border-amber-700 rounded-lg relative font-serif text-slate-800 dark:text-slate-200">
                        <div className="absolute inset-0 bg-repeat bg-center opacity-5" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
                        
                        <div className="relative text-center pt-8">
                            <h2 className="text-4xl font-bold tracking-wider uppercase text-amber-800 dark:text-amber-300">Certificate of Compliance</h2>
                            <p className="mt-4 text-sm">Issued by the</p>
                            <p className="text-lg font-semibold">Department of Personnel Management</p>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="text-md">This certificate is proudly presented to</p>
                            <p className="text-3xl font-bold my-2">{agencyName}</p>
                        </div>
                        
                        <div className="mt-6 text-center text-sm">
                           <p className="max-w-2xl mx-auto">{complianceStatement}</p>
                        </div>
                        
                        <div className="mt-12 flex justify-between items-end">
                            <div>
                                <div className="mb-2 h-12">
                                    {/* Intentionally blank space for manual signature */}
                                </div>
                                <p className="border-t-2 border-slate-700 dark:border-slate-300 pt-2 text-sm font-semibold">Taies Sansan, Secretary</p>
                                <p className="text-xs">Department of Personnel Management</p>
                            </div>
                             <div>
                                <p className="text-sm font-semibold">Date of Issuance</p>
                                <p className="text-xs">{issuanceDate}</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};