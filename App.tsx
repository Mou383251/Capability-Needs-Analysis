import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

// Import types and data
import { OfficerRecord, AgencyType, EstablishmentRecord, GradingGroup, UrgencyLevel } from './types';
import { INITIAL_CNA_DATASET } from './constants';
import { ESTABLISHMENT_DATA } from './data/establishment';

// Import components
import { Sidebar } from './components/Sidebar';
import { OrganisationalDashboard } from './components/OrganisationalDashboard';
import { DivisionGroup } from './components/DivisionGroup';
import { ImportModal } from './components/ImportModal';
import { UserGuideModal } from './components/UserGuideModal';
import { AutomatedOrganisationalAnalysisReport } from './components/AutomatedOrganisationalAnalysisReport';
import { FiveYearPlanReport } from './components/FiveYearPlanReport';
import { CompetencyDomainReport } from './components/CompetencyDomainReport';
import { CapabilityGapAnalysisReport } from './components/CapabilityGapAnalysisReport';
import { TalentSegmentationReport } from './components/TalentSegmentationReport';
import { StrategicRecommendationsReport } from './components/StrategicRecommendationsReport';
import { WorkforceSnapshotReport } from './components/WorkforceSnapshotReport';
import { DetailedCapabilityBreakdownReport } from './components/DetailedCapabilityBreakdownReport';
import { EligibleOfficersReport } from './components/EligibleOfficersReport';
import { JobGroupTrainingNeedsReport } from './components/JobGroupTrainingNeedsReport';
import { TrainingCalendarReport } from './components/TrainingCalendarReport';
import { AnnualTrainingPlanReport } from './components/AnnualTrainingPlanReport';
import { ConsolidatedStrategicPlanReport } from './components/ConsolidatedStrategicPlanReport';
import { CnaNotSubmittedList } from './components/CnaNotSubmittedList';
import { VisualDashboardSummary } from './components/VisualDashboardSummary';
import { CnaPolicyToolkit } from './components/CnaPolicyToolkit';
import { KraMatrixReport } from './components/KraMatrixReport';
import { KraDashboard } from './components/KraDashboard';
import { AutomatedEligibilityForm } from './components/AutomatedEligibilityForm';
import { AutomatedEstablishmentSummary } from './components/AutomatedEstablishmentSummary';
import { KraAlignmentReport } from './components/KraAlignmentReport';
import { KraJobGroupingsForm } from './components/KraJobGroupingsForm';
import { KraPriorityJobGroups } from './components/KraPriorityJobGroups';
import { ItemLevelAnalysisReport } from './components/ItemLevelAnalysisReport';
import { LndAiAssistantModal } from './components/LndAiAssistantModal';
import { IndividualTalentCardReport } from './components/IndividualTalentCardReport';
import { GesiPolicyToolkit } from './components/GesiPolicyToolkit';
import { AutomatedLndRecommendationsReport } from './components/AutomatedLndRecommendationsReport';
import { TrainingNeedsAnalysisReport } from './components/TrainingNeedsAnalysisReport';
import { ThemedBanner } from './components/ThemedBanner';
import { LoginPage } from './components/LoginPage';
import { GradingGroupReport } from './components/GradingGroupReport';
import { CertificateOfCompliance } from './components/CertificateOfCompliance';
import { ProfessionalCertificate } from './components/ProfessionalCertificate';
import { CertificateGenerator } from './components/CertificateGenerator';
import { OrganisationalStructureReport } from './components/OrganisationalStructureReport';

// NEW: Import L&D planning components
import { TrainingPathwaysDashboard } from './components/TrainingPathwaysDashboard';
import { TrainingCategoryModal } from './components/TrainingCategoryModal';
import { CompetencyProjectionReport } from './components/CompetencyProjectionReport';

// NEW: Import automated report components that replace manual forms
import { AutomatedDesiredExperienceReport } from './components/AutomatedDesiredExperienceReport';
import { AutomatedIndividualLndPlansReport } from './components/AutomatedIndividualLndPlansReport';
import { AutomatedJobGroupKnowledgeReport } from './components/AutomatedJobGroupKnowledgeReport';
import { AutomatedIndividualPlansReportV2 } from './components/AutomatedIndividualPlansReportV2';
import { IndividualDevelopmentProfile } from './components/IndividualDevelopmentProfile';


type View = 'organisational' | 'individual' | 'pathways' | 'gesi' | 'cna';

// Define keys for localStorage
const OFFICER_DATA_KEY = 'cna_officerData';
const ESTABLISHMENT_DATA_KEY = 'cna_establishmentData';
const AGENCY_TYPE_KEY = 'cna_agencyType';
const AGENCY_NAME_KEY = 'cna_agencyName';
const ORG_CONTEXT_KEY = 'cna_organizationalContext';
const STRATEGIC_DOC_CONTEXT_KEY = 'cna_strategicDocumentContext';
const ASSESSMENT_PROCESS_CONTEXT_KEY = 'cna_assessmentProcessContext';
const CAPACITY_ANALYSIS_CONTEXT_KEY = 'cna_capacityAnalysisContext';
const CNA_COMMUNICATION_CONTEXT_KEY = 'cna_cnaCommunicationContext';

const deDuplicateOfficers = (officers: OfficerRecord[]): OfficerRecord[] => {
    const uniqueOfficersMap = new Map<string, OfficerRecord>();
    officers.forEach(officer => {
        // Use email as the primary key. If not available, use a composite of name and position.
        const key = (officer.email || '').trim().toLowerCase();
        const compositeKey = `${(officer.name || '').trim()}-${(officer.position || '').trim()}`.toLowerCase();
        
        // Use the most reliable key available
        const finalKey = key || compositeKey;

        // Don't add if the key is effectively empty or just a dash
        if (finalKey && finalKey !== '-') {
            // Overwriting duplicates keeps the last one seen in the array.
            uniqueOfficersMap.set(finalKey, officer);
        }
    });
    return Array.from(uniqueOfficersMap.values());
};


const App: React.FC = () => {
    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        return sessionStorage.getItem('isCnaAppLoggedIn') === 'true';
    });
    
     // Helper function to get item from localStorage
    const getFromStorage = <T,>(key: string, defaultValue: T): T => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
        }
        return defaultValue;
    };

    // Core Data State from localStorage
    const [officerData, setOfficerData] = useState<OfficerRecord[]>(() => {
        const savedData = getFromStorage(OFFICER_DATA_KEY, INITIAL_CNA_DATASET);
        return deDuplicateOfficers(savedData);
    });
    const [establishmentData, setEstablishmentData] = useState<EstablishmentRecord[]>(() => getFromStorage(ESTABLISHMENT_DATA_KEY, ESTABLISHMENT_DATA));
    const [agencyType, setAgencyType] = useState<AgencyType>(() => getFromStorage(AGENCY_TYPE_KEY, 'National Agency'));
    const [agencyName, setAgencyName] = useState<string>(() => getFromStorage(AGENCY_NAME_KEY, 'Department of Personnel Management (Sample)'));
    const [organizationalContext, setOrganizationalContext] = useState<string>(() => getFromStorage(ORG_CONTEXT_KEY, ''));
    const [strategicDocumentContext, setStrategicDocumentContext] = useState<string>(() => getFromStorage(STRATEGIC_DOC_CONTEXT_KEY, ''));
    const [assessmentProcessContext, setAssessmentProcessContext] = useState<string>(() => getFromStorage(ASSESSMENT_PROCESS_CONTEXT_KEY, ''));
    const [capacityAnalysisContext, setCapacityAnalysisContext] = useState<string>(() => getFromStorage(CAPACITY_ANALYSIS_CONTEXT_KEY, ''));
    const [cnaCommunicationContext, setCnaCommunicationContext] = useState<string>(() => getFromStorage(CNA_COMMUNICATION_CONTEXT_KEY, ''));
    
    // UI State
    const [currentView, setCurrentView] = useState<View>('organisational');
    const [gradingGroupFilter, setGradingGroupFilter] = useState<GradingGroup | 'All'>('All');
    const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'All'>('All');
    
    // Modal Visibility State
    const [showImportModal, setShowImportModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showLndAiAssistant, setShowLndAiAssistant] = useState(false);
    
    const [showAiAnalysis, setShowAiAnalysis] = useState(false);
    const [showLndReport, setShowLndReport] = useState(false);
    const [showFiveYearPlan, setShowFiveYearPlan] = useState(false);
    const [showCompetencyReport, setShowCompetencyReport] = useState(false);
    const [showGapAnalysis, setShowGapAnalysis] = useState(false);
    const [showTalentSegmentation, setShowTalentSegmentation] = useState(false);
    const [showStrategicRecs, setShowStrategicRecs] = useState(false);
    const [showWorkforceSnapshot, setShowWorkforceSnapshot] = useState(false);
    const [showDetailedCapability, setShowDetailedCapability] = useState(false);
    const [showEligibleOfficers, setShowEligibleOfficers] = useState(false);
    const [showJobGroupNeeds, setShowJobGroupNeeds] = useState(false);
    const [showTrainingCalendar, setShowTrainingCalendar] = useState(false);
    const [showAnnualPlan, setShowAnnualPlan] = useState(false);
    const [showConsolidatedPlan, setShowConsolidatedPlan] = useState(false);
    const [showCnaNotSubmitted, setShowCnaNotSubmitted] = useState(false);
    const [showVisualSummary, setShowVisualSummary] = useState(false);
    const [showDesiredExperience, setShowDesiredExperience] = useState(false);
    const [showIndividualLndPlan, setShowIndividualLndPlan] = useState(false);
    const [showKraMatrix, setShowKraMatrix] = useState(false);
    const [showKraDashboard, setShowKraDashboard] = useState(false);
    const [showAutomatedEligibilityForm, setShowAutomatedEligibilityForm] = useState(false);
    const [showAutomatedEstablishmentSummary, setShowAutomatedEstablishmentSummary] = useState(false);
    const [showJobGroupKnowledgeForm, setShowJobGroupKnowledgeForm] = useState(false);
    const [showIndividualLndPlanForm, setShowIndividualLndPlanForm] = useState(false);
    const [showKraAlignmentReport, setShowKraAlignmentReport] = useState(false);
    const [showKraJobGroupings, setShowKraJobGroupings] = useState(false);
    const [showKraPriorityJobGroups, setShowKraPriorityJobGroups] = useState(false);
    const [showItemLevelAnalysis, setShowItemLevelAnalysis] = useState(false);
    const [showComplianceCertificate, setShowComplianceCertificate] = useState(false);
    const [showProfessionalCertificate, setShowProfessionalCertificate] = useState(false);
    const [showCertificateGenerator, setShowCertificateGenerator] = useState(false);
    const [showGradingGroupReport, setShowGradingGroupReport] = useState(false);
    const [showOrganisationalStructureReport, setShowOrganisationalStructureReport] = useState(false);

    // New state for L&D Planning view
    const [showTrainingCategory, setShowTrainingCategory] = useState<string | null>(null);
    const [showAutomatedLndReport, setShowAutomatedLndReport] = useState(false);
    const [showProjectionReport, setShowProjectionReport] = useState(false);

    // Individual Officer Modal State
    const [selectedOfficerForTalentCard, setSelectedOfficerForTalentCard] = useState<OfficerRecord | null>(null);
    const [selectedOfficerForLndPlan, setSelectedOfficerForLndPlan] = useState<OfficerRecord | null>(null);
    const [loadingSuggestionsFor, setLoadingSuggestionsFor] = useState<string | null>(null);

     // useEffect to write initial state to localStorage if it's not there
    useEffect(() => {
        const initialSetup = {
            [OFFICER_DATA_KEY]: INITIAL_CNA_DATASET,
            [ESTABLISHMENT_DATA_KEY]: ESTABLISHMENT_DATA,
            [AGENCY_TYPE_KEY]: 'National Agency',
            [AGENCY_NAME_KEY]: 'Department of Personnel Management (Sample)',
            [ORG_CONTEXT_KEY]: '',
            [STRATEGIC_DOC_CONTEXT_KEY]: '',
            [ASSESSMENT_PROCESS_CONTEXT_KEY]: '',
            [CAPACITY_ANALYSIS_CONTEXT_KEY]: '',
            [CNA_COMMUNICATION_CONTEXT_KEY]: ''
        };

        for (const [key, value] of Object.entries(initialSetup)) {
            if (localStorage.getItem(key) === null) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        }
    }, []);

    // useEffect for real-time synchronization across tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (!e.newValue) return;
            try {
                const newValue = JSON.parse(e.newValue);
                switch (e.key) {
                    case OFFICER_DATA_KEY: setOfficerData(deDuplicateOfficers(newValue)); break;
                    case ESTABLISHMENT_DATA_KEY: setEstablishmentData(newValue); break;
                    case AGENCY_TYPE_KEY: setAgencyType(newValue); break;
                    case AGENCY_NAME_KEY: setAgencyName(newValue); break;
                    case ORG_CONTEXT_KEY: setOrganizationalContext(newValue); break;
                    case STRATEGIC_DOC_CONTEXT_KEY: setStrategicDocumentContext(newValue); break;
                    case ASSESSMENT_PROCESS_CONTEXT_KEY: setAssessmentProcessContext(newValue); break;
                    case CAPACITY_ANALYSIS_CONTEXT_KEY: setCapacityAnalysisContext(newValue); break;
                    case CNA_COMMUNICATION_CONTEXT_KEY: setCnaCommunicationContext(newValue); break;
                }
            } catch (error) {
                console.error("Error processing storage event:", error);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Wrapped state setters that also write to localStorage
    const updateAndStore = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: string) => (newValue: T | ((prevState: T) => T)) => {
        setter(prevValue => {
            const valueToStore = newValue instanceof Function ? newValue(prevValue) : newValue;
            localStorage.setItem(key, JSON.stringify(valueToStore));
            return valueToStore;
        });
    };
    
    const handleSetOfficerData = updateAndStore(setOfficerData, OFFICER_DATA_KEY);
    const handleSetEstablishmentData = updateAndStore(setEstablishmentData, ESTABLISHMENT_DATA_KEY);
    const handleSetAgencyType = updateAndStore(setAgencyType, AGENCY_TYPE_KEY);
    const handleSetAgencyName = updateAndStore(setAgencyName, AGENCY_NAME_KEY);
    const handleSetOrganizationalContext = updateAndStore(setOrganizationalContext, ORG_CONTEXT_KEY);
    const handleSetStrategicDocumentContext = updateAndStore(setStrategicDocumentContext, STRATEGIC_DOC_CONTEXT_KEY);
    const handleSetAssessmentProcessContext = updateAndStore(setAssessmentProcessContext, ASSESSMENT_PROCESS_CONTEXT_KEY);
    const handleSetCapacityAnalysisContext = updateAndStore(setCapacityAnalysisContext, CAPACITY_ANALYSIS_CONTEXT_KEY);
    const handleSetCnaCommunicationContext = updateAndStore(setCnaCommunicationContext, CNA_COMMUNICATION_CONTEXT_KEY);
    
    // Data Handlers
    const handleImport = (newData: OfficerRecord[], newAgencyType: AgencyType, newAgencyName: string, newEstablishmentData?: EstablishmentRecord[]) => {
        handleSetOfficerData(deDuplicateOfficers(newData));
        handleSetAgencyType(newAgencyType);
        handleSetAgencyName(newAgencyName);
        if (newEstablishmentData) {
            handleSetEstablishmentData(newEstablishmentData);
        }
        setShowImportModal(false);
    };

    const handleSuggestTraining = async (officer: OfficerRecord) => {
        setSelectedOfficerForTalentCard(officer);
    };

    // Auth Handlers
    const handleLoginSuccess = () => {
        sessionStorage.setItem('isCnaAppLoggedIn', 'true');
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isCnaAppLoggedIn');
        setIsLoggedIn(false);
    };

    // View Rendering Logic
    const renderCurrentView = () => {
        switch (currentView) {
            case 'organisational':
                return <OrganisationalDashboard 
                    data={officerData}
                    establishmentData={establishmentData}
                    agencyType={agencyType}
                    agencyName={agencyName}
                    organizationalContext={organizationalContext}
                    onSetOrganizationalContext={handleSetOrganizationalContext}
                    strategicDocumentContext={strategicDocumentContext}
                    onSetStrategicDocumentContext={handleSetStrategicDocumentContext}
                    assessmentProcessContext={assessmentProcessContext}
                    onSetAssessmentProcessContext={handleSetAssessmentProcessContext}
                    capacityAnalysisContext={capacityAnalysisContext}
                    onSetCapacityAnalysisContext={handleSetCapacityAnalysisContext}
                    cnaCommunicationContext={cnaCommunicationContext}
                    onSetCnaCommunicationContext={handleSetCnaCommunicationContext}
                    onShowAiAnalysis={() => setShowAiAnalysis(true)}
                    onShowLndReport={() => setShowLndReport(true)}
                    onShowFiveYearPlan={() => setShowFiveYearPlan(true)}
                    onShowCompetencyReport={() => setShowCompetencyReport(true)}
                    onShowGapAnalysis={() => setShowGapAnalysis(true)}
                    onShowTalentSegmentation={() => setShowTalentSegmentation(true)}
                    onShowStrategicRecs={() => setShowStrategicRecs(true)}
                    onShowWorkforceSnapshot={() => setShowWorkforceSnapshot(true)}
                    onShowDetailedCapability={() => setShowDetailedCapability(true)}
                    onShowEligibleOfficers={() => setShowEligibleOfficers(true)}
                    onShowTrainingEligibilitySummary={() => alert("This specific report is now part of the Automated Forms.")}
                    onShowJobGroupNeeds={() => setShowJobGroupNeeds(true)}
                    onShowTrainingCalendar={() => setShowTrainingCalendar(true)}
                    onShowAnnualPlan={() => setShowAnnualPlan(true)}
                    onShowConsolidatedPlan={() => setShowConsolidatedPlan(true)}
                    onShowCnaNotSubmitted={() => setShowCnaNotSubmitted(true)}
                    onShowVisualSummary={() => setShowVisualSummary(true)}
                    onShowDesiredExperience={() => setShowDesiredExperience(true)}
                    onShowIndividualLndPlan={() => setShowIndividualLndPlan(true)}
                    onShowKraMatrix={() => setShowKraMatrix(true)}
                    onShowKraDashboard={() => setShowKraDashboard(true)}
                    onShowAutomatedEligibilityForm={() => setShowAutomatedEligibilityForm(true)}
                    onShowAutomatedEstablishmentSummary={() => setShowAutomatedEstablishmentSummary(true)}
                    onShowJobGroupKnowledgeForm={() => setShowJobGroupKnowledgeForm(true)}
                    onShowIndividualLndPlanForm={() => setShowIndividualLndPlanForm(true)}
                    onShowKraAlignmentReport={() => setShowKraAlignmentReport(true)}
                    onShowKraJobGroupings={() => setShowKraJobGroupings(true)}
                    onShowKraPriorityJobGroups={() => setShowKraPriorityJobGroups(true)}
                    onShowItemLevelAnalysis={() => setShowItemLevelAnalysis(true)}
                    onShowComplianceCertificate={() => setShowComplianceCertificate(true)}
                    onShowProfessionalCertificate={() => setShowProfessionalCertificate(true)}
                    onShowCertificateGenerator={() => setShowCertificateGenerator(true)}
                    onShowGradingGroupReport={() => setShowGradingGroupReport(true)}
                    onShowOrganisationalStructureReport={() => setShowOrganisationalStructureReport(true)}
                />;
            case 'individual':
                const filteredOfficers = officerData.filter(officer => {
                    const gradingMatch = gradingGroupFilter === 'All' || officer.gradingGroup === gradingGroupFilter;
                    const urgencyMatch = urgencyFilter === 'All' || officer.urgency === urgencyFilter;
                    return gradingMatch && urgencyMatch;
                });

                const groupedByDivision = filteredOfficers.reduce((acc, officer) => {
                    const division = officer.division || 'Unassigned';
                    if (!acc[division]) acc[division] = [];
                    acc[division].push(officer);
                    return acc;
                }, {} as Record<string, OfficerRecord[]>);

                const gradingGroupOptions: (GradingGroup | 'All')[] = ['All', 'Junior Officer', 'Senior Officer', 'Manager', 'Senior Management', 'Other'];
                const urgencyOptions: (UrgencyLevel | 'All')[] = ['All', UrgencyLevel.Low, UrgencyLevel.Medium, UrgencyLevel.High];

                return (
                     <div className="flex-1 flex flex-col">
                        <header className="p-6 bg-slate-100 dark:bg-blue-950/50 sticky top-0 z-10 border-b border-slate-300 dark:border-blue-800">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Individual Officer View</h1>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review individual profiles, capability gaps, and generate development plans.</p>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div>
                                        <label htmlFor="grading-filter" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Filter by Grade</label>
                                        <select
                                            id="grading-filter"
                                            value={gradingGroupFilter}
                                            onChange={(e) => setGradingGroupFilter(e.target.value as GradingGroup | 'All')}
                                            className="mt-1 block w-full sm:w-48 pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {gradingGroupOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="urgency-filter" className="block text-xs font-medium text-gray-500 dark:text-gray-400">Filter by Urgency</label>
                                        <select
                                            id="urgency-filter"
                                            value={urgencyFilter}
                                            onChange={(e) => setUrgencyFilter(e.target.value as UrgencyLevel | 'All')}
                                            className="mt-1 block w-full sm:w-48 pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {urgencyOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </header>
                        <div className="p-6">
                            {Object.entries(groupedByDivision).length > 0 ? (
                                Object.entries(groupedByDivision).map(([divisionName, officers]) => (
                                    <DivisionGroup
                                        key={divisionName}
                                        divisionName={divisionName}
                                        officers={officers}
                                        onViewSummary={(officer) => setSelectedOfficerForLndPlan(officer)}
                                        onSuggestTraining={handleSuggestTraining}
                                        loadingSuggestionsFor={loadingSuggestionsFor}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12 px-6 bg-white dark:bg-blue-900 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800">
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">No Officers Found</h3>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">There are no officers matching the selected filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'pathways':
                return <TrainingPathwaysDashboard 
                    agencyType={agencyType}
                    setAgencyType={handleSetAgencyType}
                    agencyName={agencyName}
                    setAgencyName={handleSetAgencyName}
                    onSelectCategory={(category) => setShowTrainingCategory(category)}
                    onGeneratePlan={() => setShowAnnualPlan(true)}
                    onShowAutomatedLndReport={() => setShowAutomatedLndReport(true)}
                    onShowProjectionReport={() => setShowProjectionReport(true)}
                />;
            case 'gesi':
                return <GesiPolicyToolkit />;
            case 'cna':
                return <CnaPolicyToolkit />;
            default:
                return <div>Select a view</div>;
        }
    };
    
    if (!isLoggedIn) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="flex h-screen text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-blue-950/50">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                onImportClick={() => setShowImportModal(true)}
                onHelpClick={() => setShowHelpModal(true)}
                onShowLndAiAssistant={() => setShowLndAiAssistant(true)}
                onLogout={handleLogout}
            />
            <div className="flex-1 flex flex-col relative">
                <ThemedBanner />
                <div className="relative z-10 flex-1 overflow-y-auto">
                    {renderCurrentView()}
                </div>
            </div>

            {/* All Modals */}
            {showImportModal && <ImportModal onImport={handleImport} onClose={() => setShowImportModal(false)} />}
            {showHelpModal && <UserGuideModal onClose={() => setShowHelpModal(false)} />}
            {showAiAnalysis && <AutomatedOrganisationalAnalysisReport data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowAiAnalysis(false)} />}
            {selectedOfficerForTalentCard && <IndividualTalentCardReport officer={selectedOfficerForTalentCard} establishmentData={establishmentData} onClose={() => setSelectedOfficerForTalentCard(null)} />}
            {selectedOfficerForLndPlan && <IndividualDevelopmentProfile officer={selectedOfficerForLndPlan} agencyName={agencyName} onClose={() => setSelectedOfficerForLndPlan(null)} />}
            {showLndReport && <TrainingNeedsAnalysisReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowLndReport(false)} />}
            {showFiveYearPlan && <FiveYearPlanReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowFiveYearPlan(false)} />}
            {showCompetencyReport && <CompetencyDomainReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowCompetencyReport(false)} />}
            {showGapAnalysis && <CapabilityGapAnalysisReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowGapAnalysis(false)} />}
            {showTalentSegmentation && <TalentSegmentationReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowTalentSegmentation(false)} />}
            {showStrategicRecs && <StrategicRecommendationsReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowStrategicRecs(false)} />}
            {showWorkforceSnapshot && <WorkforceSnapshotReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowWorkforceSnapshot(false)} />}
            {showDetailedCapability && <DetailedCapabilityBreakdownReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowDetailedCapability(false)} />}
            {showEligibleOfficers && <EligibleOfficersReport data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowEligibleOfficers(false)} />}
            {showJobGroupNeeds && <JobGroupTrainingNeedsReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowJobGroupNeeds(false)} />}
            {showTrainingCalendar && <TrainingCalendarReport data={officerData} agencyType={agencyType} onClose={() => setShowTrainingCalendar(false)} />}
            {showAnnualPlan && <AnnualTrainingPlanReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowAnnualPlan(false)} />}
            {showConsolidatedPlan && <ConsolidatedStrategicPlanReport data={officerData} agencyType={agencyType} agencyName={agencyName} organizationalContext={organizationalContext} strategicDocumentContext={strategicDocumentContext} assessmentProcessContext={assessmentProcessContext} capacityAnalysisContext={capacityAnalysisContext} cnaCommunicationContext={cnaCommunicationContext} onClose={() => setShowConsolidatedPlan(false)} />}
            {showCnaNotSubmitted && <CnaNotSubmittedList cnaData={officerData} establishmentData={establishmentData} onClose={() => setShowCnaNotSubmitted(false)} />}
            {showVisualSummary && <VisualDashboardSummary data={officerData} onClose={() => setShowVisualSummary(false)} />}
            {showKraMatrix && <KraMatrixReport agencyName={agencyName} onClose={() => setShowKraMatrix(false)} />}
            {showKraDashboard && <KraDashboard onClose={() => setShowKraDashboard(false)} />}
            {showAutomatedEligibilityForm && <AutomatedEligibilityForm data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowAutomatedEligibilityForm(false)} />}
            {showAutomatedEstablishmentSummary && <AutomatedEstablishmentSummary data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowAutomatedEstablishmentSummary(false)} />}
            {showKraAlignmentReport && <KraAlignmentReport cnaData={officerData} establishmentData={establishmentData} onClose={() => setShowKraAlignmentReport(false)} />}
            {showKraJobGroupings && <KraJobGroupingsForm onClose={() => setShowKraJobGroupings(false)} />}
            {showKraPriorityJobGroups && <KraPriorityJobGroups onClose={() => setShowKraPriorityJobGroups(false)} />}
            {showItemLevelAnalysis && <ItemLevelAnalysisReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowItemLevelAnalysis(false)} />}
            {showComplianceCertificate && <CertificateOfCompliance agencyName={agencyName} onClose={() => setShowComplianceCertificate(false)} />}
            {showProfessionalCertificate && <ProfessionalCertificate onClose={() => setShowProfessionalCertificate(false)} />}
            {showCertificateGenerator && <CertificateGenerator onClose={() => setShowCertificateGenerator(false)} />}
            {showLndAiAssistant && <LndAiAssistantModal onClose={() => setShowLndAiAssistant(false)} />}
            {showGradingGroupReport && <GradingGroupReport data={officerData} onClose={() => setShowGradingGroupReport(false)} />}
            {showOrganisationalStructureReport && <OrganisationalStructureReport data={officerData} establishmentData={establishmentData} agencyName={agencyName} onClose={() => setShowOrganisationalStructureReport(false)} />}

            {/* L&D Planning Modals */}
            {showTrainingCategory && <TrainingCategoryModal data={officerData} categoryName={showTrainingCategory} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowTrainingCategory(null)} />}
            {showAutomatedLndReport && <AutomatedLndRecommendationsReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowAutomatedLndReport(false)} />}
            {showProjectionReport && <CompetencyProjectionReport data={officerData} onClose={() => setShowProjectionReport(false)} />}

            {/* NEW: Automated reports replacing manual forms */}
            {showDesiredExperience && <AutomatedDesiredExperienceReport data={officerData} onClose={() => setShowDesiredExperience(false)} />}
            {showIndividualLndPlan && <AutomatedIndividualLndPlansReport data={officerData} establishmentData={establishmentData} agencyName={agencyName} agencyType={agencyType} onClose={() => setShowIndividualLndPlan(false)} />}
            {showJobGroupKnowledgeForm && <AutomatedJobGroupKnowledgeReport data={officerData} onClose={() => setShowJobGroupKnowledgeForm(false)} />}
            {showIndividualLndPlanForm && <AutomatedIndividualPlansReportV2 data={officerData} agencyName={agencyName} agencyType={agencyType} onClose={() => setShowIndividualLndPlanForm(false)} />}
        </div>
    );
};

export default App;