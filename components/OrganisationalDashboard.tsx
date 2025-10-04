import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { OfficerRecord, AgencyType, PerformanceRatingLevel, QUESTION_TEXT_MAPPING, EstablishmentRecord } from '../types';
import { ChartComponent } from './charts';
import { ChartPieIcon, SparklesIcon, DocumentChartBarIcon, CalendarDaysIcon, BuildingOfficeIcon, PresentationChartLineIcon, ChevronDownIcon, DocumentIcon } from './icons';
import { ReportContextInputs } from './ReportContextInputs';

interface DashboardProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
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
  onShowVisualSummary: () => void;
  onShowAiAnalysis: () => void;
  onShowLndReport: () => void;
  onShowFiveYearPlan: () => void;
  onShowCompetencyReport: () => void;
  onShowGapAnalysis: () => void;
  onShowTalentSegmentation: () => void;
  onShowStrategicRecs: () => void;
  onShowWorkforceSnapshot: () => void;
  onShowDetailedCapability: () => void;
  onShowEligibleOfficers: () => void;
  onShowTrainingEligibilitySummary: () => void;
  onShowJobGroupNeeds: () => void;
  onShowTrainingCalendar: () => void;
  onShowAnnualPlan: () => void;
  onShowConsolidatedPlan: () => void;
  onShowCnaNotSubmitted: () => void;
  onShowDesiredExperience: () => void;
  onShowIndividualLndPlan: () => void;
  onShowKraMatrix: () => void;
  onShowKraDashboard: () => void;
  onShowAutomatedEligibilityForm: () => void;
  onShowAutomatedEstablishmentSummary: () => void;
  onShowJobGroupKnowledgeForm: () => void;
  onShowIndividualLndPlanForm: () => void;
  onShowKraAlignmentReport: () => void;
  onShowKraJobGroupings: () => void;
  onShowKraPriorityJobGroups: () => void;
  onShowItemLevelAnalysis: () => void;
  onShowComplianceCertificate: () => void;
  onShowProfessionalCertificate: () => void;
  onShowCertificateGenerator: () => void;
  onShowGradingGroupReport: () => void;
  onShowOrganisationalStructureReport: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; colorClass: string; description?: string }> = ({ title, value, colorClass, description }) => (
    <div className={`p-5 rounded-xl shadow-md bg-white/70 backdrop-blur-sm border border-slate-300`}>
        <div className={`w-2 h-2 rounded-full ${colorClass} mb-2`}></div>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <h3 className="text-sm font-medium text-slate-600 truncate">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-md border border-slate-300">
         <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
         <div>{children}</div>
    </div>
);

const DropdownMenu: React.FC<{
    children: React.ReactNode;
    parentRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    align?: 'left' | 'right';
}> = ({ children, parentRef, onClose, align = 'right' }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        opacity: 0,
        zIndex: 50, // High z-index to appear above everything
    });

    useEffect(() => {
        if (parentRef.current && menuRef.current) {
            const parentRect = parentRef.current.getBoundingClientRect();
            const menuRect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let top = parentRect.bottom + 4; // 4px margin below button
            let left = align === 'right' 
                ? parentRect.right - menuRect.width 
                : parentRect.left;

            // Viewport collision detection
            if (top + menuRect.height > viewportHeight - 4) { // check against bottom edge
                top = parentRect.top - menuRect.height - 4;
            }
            if (left < 4) { // check against left edge
                left = 4;
            }
            if (left + menuRect.width > viewportWidth - 4) { // check against right edge
                left = viewportWidth - menuRect.width - 4;
            }

            setStyle(prevStyle => ({
                ...prevStyle,
                top: `${top}px`,
                left: `${left}px`,
                opacity: 1,
            }));
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                parentRef.current && !parentRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [parentRef, onClose, align]);
    
    if (typeof document === 'undefined') return null;
    
    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            style={style}
            className="w-72 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 dark:ring-white/10 focus:outline-none transition-opacity duration-150"
            role="menu"
            aria-orientation="vertical"
        >
            <div className="py-1">{children}</div>
        </div>,
        document.body
    );
};


const Dropdown: React.FC<{
    buttonContent: React.ReactNode;
    children: React.ReactNode;
}> = ({ buttonContent, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    return (
        <div className="inline-block text-left" ref={buttonRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors text-sm"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {buttonContent}
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <DropdownMenu parentRef={buttonRef} onClose={() => setIsOpen(false)} align="right">
                    {React.Children.map(children, child => 
                        React.isValidElement(child) ? React.cloneElement(child, { onClick: () => { (child.props as any).onClick(); setIsOpen(false); } } as any) : child
                    )}
                </DropdownMenu>
            )}
        </div>
    );
};

const DropdownItem: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }}
       className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem">
        {children}
    </a>
);
const DropdownSeparator: React.FC = () => <div className="border-t my-1 border-slate-200 dark:border-slate-700"></div>;


export const OrganisationalDashboard: React.FC<DashboardProps> = (props) => {
    const { data, establishmentData, agencyType, agencyName, onShowVisualSummary, ...restProps } = props;
    
    const analysis = useMemo(() => {
        if (!data || !establishmentData) return null;

        // Scan establishment data to identify vacant positions based on status or occupant name.
        const vacantPositionsCount = establishmentData.filter(p => 
            p.status === 'Vacant' || 
            p.occupant.toLowerCase() === 'vacant' ||
            p.occupant.includes('*****VACANT*****') ||
            (p.occupant || '').trim() === ''
        ).length;

        const totalEstablishment = establishmentData.length;
        const filledPositions = totalEstablishment - vacantPositionsCount;
        const vacancyRate = totalEstablishment > 0 ? (vacantPositionsCount / totalEstablishment) * 100 : 0;
        
        const cnaSubmittedCount = data.length;
        const cnaNotSubmittedCount = Math.max(0, filledPositions - cnaSubmittedCount);
        const submissionRate = filledPositions > 0 ? (cnaSubmittedCount / filledPositions * 100) : 0;
        const cnaNotSubmittedRate = filledPositions > 0 ? (cnaNotSubmittedCount / filledPositions * 100) : 0;

        const officersRequiringUpskilling = data.filter(o => o.capabilityRatings.some(r => r.gapScore >= 3)).length;
        const officersRequiringUpskillingPercentage = data.length > 0 ? (officersRequiringUpskilling / data.length) * 100 : 0;
        const highUrgencyCount = data.filter(o => o.urgency === 'High').length;

        const spaDistribution = data.reduce((acc, o) => {
            const level = o.performanceRatingLevel;
            if (level !== 'Not Rated') {
                acc[level] = (acc[level] || 0) + 1;
            }
            return acc;
        }, {} as Record<PerformanceRatingLevel, number>);

        const gapFrequency: Record<string, number> = {};
        data.forEach(officer => {
            officer.capabilityRatings.forEach(rating => {
                if (rating.gapScore >= 3) {
                    gapFrequency[rating.questionCode] = (gapFrequency[rating.questionCode] || 0) + 1;
                }
            });
        });

        const topGapsByFrequency = Object.entries(gapFrequency)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 7)
            .map(([code, frequency]) => ({ code, frequency }));


        return {
            totalEstablishment,
            filledPositions,
            vacantPositions: vacantPositionsCount,
            vacancyRate,
            submissionRate,
            cnaSubmittedCount,
            cnaNotSubmittedCount,
            cnaNotSubmittedRate,
            officersRequiringUpskillingPercentage,
            highUrgencyCount,
            spaDistribution,
            topGapsByFrequency,
        };
    }, [data, establishmentData]);
    
    if (!analysis) return <div className="p-6">Loading analysis...</div>;
    
    const { totalEstablishment, filledPositions, vacantPositions, vacancyRate, submissionRate, cnaSubmittedCount, cnaNotSubmittedCount, cnaNotSubmittedRate, officersRequiringUpskillingPercentage, highUrgencyCount, spaDistribution, topGapsByFrequency } = analysis;
    
    const spaDistOrder: PerformanceRatingLevel[] = ['Well Above Required', 'Above Required', 'At Required Level', 'Below Required Level', 'Well Below Required Level'];
    const spaDistLabels = spaDistOrder.filter(label => spaDistribution[label] > 0);
    const spaDistValues = spaDistLabels.map(label => spaDistribution[label]);

    const spaDistChartData = {
        labels: spaDistLabels,
        datasets: [{
            label: 'SPA Distribution',
            data: spaDistValues,
            backgroundColor: ['#16A34A', '#0EA5E9', '#FACC15', '#F97316', '#EF4444', '#64748B'],
            borderColor: '#f3f4f6',
            borderWidth: 4,
            hoverOffset: 8
        }],
    };

    const topGapsChartData = {
        labels: topGapsByFrequency.map(g => g.code),
        datasets: [{
            label: 'Frequency Count',
            data: topGapsByFrequency.map(g => g.frequency),
            backgroundColor: 'rgba(217, 119, 6, 0.8)',
            borderColor: 'rgba(217, 119, 6, 1)',
            borderWidth: 1,
            borderRadius: 6,
        }]
    };

    return (
        <div className="flex-1 flex flex-col">
             <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-20 border-b border-slate-300">
                <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                         <div>
                            <h1 className="text-2xl font-bold leading-tight text-slate-800">
                                Organisational Overview
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Showing data for: <span className="font-semibold text-slate-700">{agencyName} – {agencyType}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Dropdown buttonContent={<><SparklesIcon className="w-5 h-5 text-amber-600" /><span>Automated Reports</span></>}>
                                <DropdownItem onClick={restProps.onShowAiAnalysis}>Automated Organisational Analysis</DropdownItem>
                                <DropdownItem onClick={restProps.onShowLndReport}>L&amp;D Report</DropdownItem>
                                <DropdownItem onClick={restProps.onShowCompetencyReport}>Competency Domain Analysis</DropdownItem>
                                <DropdownItem onClick={restProps.onShowGapAnalysis}>Capability Gap Analysis</DropdownItem>
                                <DropdownItem onClick={restProps.onShowTalentSegmentation}>Talent Segmentation Report</DropdownItem>
                                <DropdownItem onClick={restProps.onShowStrategicRecs}>Strategic L&amp;D Recommendations</DropdownItem>
                                <DropdownItem onClick={restProps.onShowWorkforceSnapshot}>Workforce Snapshot</DropdownItem>
                            </Dropdown>
                            <Dropdown buttonContent={<><DocumentChartBarIcon className="w-5 h-5 text-slate-500" /><span>Detailed Reports</span></>}>
                                <DropdownItem onClick={restProps.onShowDetailedCapability}>Detailed Capability Breakdown</DropdownItem>
                                <DropdownItem onClick={restProps.onShowItemLevelAnalysis}>Item-Level Questionnaire Analysis</DropdownItem>
                                <DropdownItem onClick={restProps.onShowCnaNotSubmitted}>Officers - CNA Not Submitted</DropdownItem>
                                <DropdownItem onClick={restProps.onShowGradingGroupReport}>Grading Group Report</DropdownItem>
                                <DropdownItem onClick={restProps.onShowOrganisationalStructureReport}>Organisational Structure Analysis</DropdownItem>
                            </Dropdown>
                            <Dropdown buttonContent={<><CalendarDaysIcon className="w-5 h-5 text-slate-500" /><span>Planning &amp; Forms</span></>}>
                                <DropdownItem onClick={restProps.onShowFiveYearPlan}>5-Year L&amp;D Plan</DropdownItem>
                                <DropdownItem onClick={restProps.onShowAnnualPlan}>Annual Training Plan (2026)</DropdownItem>
                                <DropdownItem onClick={restProps.onShowConsolidatedPlan}>Consolidated Strategic Plan Report</DropdownItem>
                                <DropdownItem onClick={restProps.onShowJobGroupNeeds}>Job Group Training Needs</DropdownItem>
                                <DropdownItem onClick={restProps.onShowTrainingCalendar}>Training Calendar</DropdownItem>
                                <DropdownSeparator />
                                <DropdownItem onClick={restProps.onShowEligibleOfficers}>Eligible Officers Report</DropdownItem>
                                <DropdownItem onClick={restProps.onShowIndividualLndPlanForm}>Individual L&amp;D Plan (Manual Form)</DropdownItem>
                                <DropdownItem onClick={restProps.onShowDesiredExperience}>Desired Work Experience Form</DropdownItem>
                                <DropdownItem onClick={restProps.onShowJobGroupKnowledgeForm}>Job Group Knowledge Form</DropdownItem>
                                <DropdownSeparator />
                                <DropdownItem onClick={restProps.onShowComplianceCertificate}>Certificate of Compliance</DropdownItem>
                                <DropdownItem onClick={restProps.onShowProfessionalCertificate}>Certificate of Achievement</DropdownItem>
                                <DropdownItem onClick={restProps.onShowCertificateGenerator}>Certificate of Compliance (Ornate)</DropdownItem>
                            </Dropdown>
                            <Dropdown buttonContent={<><BuildingOfficeIcon className="w-5 h-5 text-slate-500" /><span>Automated Forms</span></>}>
                                <DropdownItem onClick={restProps.onShowAutomatedEstablishmentSummary}>Stage 1: Establishment Summary</DropdownItem>
                                <DropdownItem onClick={restProps.onShowAutomatedEligibilityForm}>Stage 2: Eligible Officers for Training</DropdownItem>
                            </Dropdown>
                             <Dropdown buttonContent={<><PresentationChartLineIcon className="w-5 h-5 text-slate-500" /><span>KRA Planning Suite</span></>}>
                                <DropdownItem onClick={restProps.onShowKraDashboard}>KRA Dashboard &amp; Summary</DropdownItem>
                                <DropdownItem onClick={restProps.onShowKraMatrix}>KRA Staffing Plan (Matrix)</DropdownItem>
                                <DropdownItem onClick={restProps.onShowKraAlignmentReport}>KRA Establishment Alignment</DropdownItem>
                                <DropdownItem onClick={restProps.onShowKraJobGroupings}>KRA Thematic Groupings</DropdownItem>
                                <DropdownItem onClick={restProps.onShowKraPriorityJobGroups}>KRA Priority Job Groups (Reference)</DropdownItem>
                            </Dropdown>
                            <button onClick={onShowVisualSummary} className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors text-sm">
                                <ChartPieIcon className="w-5 h-5" />
                                <span>Visual Summary</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="p-6 flex-1">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-6">
                    <StatCard title="Total Establishment" value={totalEstablishment} colorClass="bg-purple-400" description="Total funded positions" />
                    <StatCard title="Filled Positions" value={filledPositions} colorClass="bg-blue-400" description={`${((filledPositions / totalEstablishment) * 100).toFixed(1)}% of establishment`} />
                    <StatCard title="Vacant Positions" value={vacantPositions} colorClass="bg-gray-400" description={`${vacancyRate.toFixed(1)}% of establishment`} />
                    <StatCard title="CNA Submitted" value={`${submissionRate.toFixed(1)}%`} colorClass="bg-green-400" description={`${cnaSubmittedCount} of ${filledPositions} filled`} />
                    <StatCard title="CNA Not Submitted" value={cnaNotSubmittedCount} colorClass="bg-yellow-400" description={`${cnaNotSubmittedRate.toFixed(1)}% of filled`} />
                    <StatCard title="Require Upskilling" value={`${officersRequiringUpskillingPercentage.toFixed(0)}%`} colorClass="bg-orange-400" description={`of ${cnaSubmittedCount} submitted`} />
                    <StatCard title="High Urgency" value={highUrgencyCount} colorClass="bg-red-400" description={`of ${cnaSubmittedCount} submitted`} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
                    <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3">
                             <ChartCard title="Top 7 Capability Gaps (by Frequency)">
                                <div className="h-80">
                                    <ChartComponent type="horizontalBar" data={topGapsChartData} options={{
                                        maintainAspectRatio: false,
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    title: (tooltipItems: any) => QUESTION_TEXT_MAPPING[tooltipItems[0].label] || tooltipItems[0].label,
                                                }
                                            }
                                        }
                                    }}/>
                                </div>
                             </ChartCard>
                        </div>
                        <div className="lg:col-span-2">
                            <ChartCard title="SPA Performance Distribution">
                                <div className="h-80 flex items-center justify-center">
                                    <ChartComponent type="doughnut" data={spaDistChartData} options={{plugins: {legend: {position: 'right'}}}} />
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                    <div className="xl:col-span-1">
                       <ReportContextInputs
                            organizationalContext={props.organizationalContext}
                            onSetOrganizationalContext={props.onSetOrganizationalContext}
                            strategicDocumentContext={props.strategicDocumentContext}
                            onSetStrategicDocumentContext={props.onSetStrategicDocumentContext}
                            assessmentProcessContext={props.assessmentProcessContext}
                            onSetAssessmentProcessContext={props.onSetAssessmentProcessContext}
                            capacityAnalysisContext={props.capacityAnalysisContext}
                            onSetCapacityAnalysisContext={props.onSetCapacityAnalysisContext}
                            cnaCommunicationContext={props.cnaCommunicationContext}
                            onSetCnaCommunicationContext={props.onSetCnaCommunicationContext}
                        />
                    </div>
                </div>
                <footer className="bg-gradient-to-r from-amber-600 to-amber-800 p-4 text-center text-white shadow-inner mt-6 flex-shrink-0">
                    <p className="text-sm font-semibold">Fostering a Culture of Continuous Learning and Development.</p>
                    <p className="text-xs mt-1 text-amber-100">This dashboard provides a strategic overview of organizational capabilities.</p>
                </footer>
            </main>
        </div>
    );
};