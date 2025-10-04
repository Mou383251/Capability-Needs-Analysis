import React, { useState } from 'react';

interface ReportContextInputsProps {
    organizationalContext: string;
    onSetOrganizationalContext: (context: string) => void;
    strategicDocumentContext: string;
    onSetStrategicDocumentContext: (context: string) => void;
    assessmentProcessContext: string;
    onSetAssessmentProcessContext: (context: string) => void;
    capacityAnalysisContext: string;
    onSetCapacityAnalysisContext: (context: string) => void;
    cnaCommunicationContext: string;
    onSetCnaCommunicationContext: (context: string) => void;
}

type ContextTab = 'org' | 'strategic' | 'assessment' | 'capacity' | 'comm';

const TABS: { id: ContextTab, label: string }[] = [
    { id: 'org', label: 'Organizational' },
    { id: 'strategic', label: 'Strategic Docs' },
    { id: 'assessment', label: 'Assessment' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'comm', label: 'Communication' },
];

export const ReportContextInputs: React.FC<ReportContextInputsProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ContextTab>('org');

    const renderTextarea = () => {
        switch (activeTab) {
            case 'org':
                return {
                    value: props.organizationalContext,
                    onChange: props.onSetOrganizationalContext,
                    placeholder: "Describe the current and future capacity of your organization, sourcing information from the organizational establishment data. Detail current staff strengths, weaknesses, and overall capacity.",
                    description: "This information will be used in the 'Organizational Context' section of the consolidated report. Source information from the organizational establishment data to describe current staff, strengths, and overall capacity."
                };
            case 'strategic':
                 return {
                    value: props.strategicDocumentContext,
                    onChange: props.onSetStrategicDocumentContext,
                    placeholder: "Describe the strategic and HR documents used...",
                    description: "Used in the Methodology section and supports the evidence base for the capacity analysis."
                };
            case 'assessment':
                 return {
                    value: props.assessmentProcessContext,
                    onChange: props.onSetAssessmentProcessContext,
                    placeholder: "Summarize the assessment process conducted...",
                    description: "Used in the Assessment Participation Summary and supports interpretation of response reliability."
                };
            case 'capacity':
                 return {
                    value: props.capacityAnalysisContext,
                    onChange: props.onSetCapacityAnalysisContext,
                    placeholder: "Confirm if individual, team, division, and organizational capacity ratings are finalized...",
                    description: "Drives the Visual Analysis Section and Gap Matrix Table in the Consolidated Strategic Plan Report."
                };
            case 'comm':
                 return {
                    value: props.cnaCommunicationContext,
                    onChange: props.onSetCnaCommunicationContext,
                    placeholder: "Describe how the CNA process was communicated...",
                    description: "This information will be summarised under Stakeholder Engagement & Communication Efforts."
                };
            default:
                return { value: '', onChange: () => {}, placeholder: '', description: '' };
        }
    };

    const currentTextarea = renderTextarea();

    return (
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-300 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Report Context Inputs</h3>
            <div className="border-b border-slate-300 mb-4">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                ? 'border-amber-500 text-amber-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-grow flex flex-col">
                <p className="text-sm text-slate-500 mb-2">{currentTextarea.description}</p>
                <textarea
                    className="w-full flex-grow p-3 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 min-h-[200px]"
                    placeholder={currentTextarea.placeholder}
                    value={currentTextarea.value}
                    onChange={(e) => currentTextarea.onChange(e.target.value)}
                />
            </div>
        </div>
    );
};