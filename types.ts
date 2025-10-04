export type GradingGroup = 'Junior Officer' | 'Senior Officer' | 'Manager' | 'Senior Management' | 'Other';

export enum UrgencyLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export type AgencyType = "All Agencies" | "National Agency" | "National Department" | "Provincial Administration" | "Provincial Health Authority" | "Local Level Government" | "Other";

export interface TrainingRecord {
  courseName: string;
  completionDate: string;
}

export type CurrentScoreCategory = 'Low' | 'Moderate' | 'High';

export interface CapabilityRating {
  questionCode: string;
  currentScore: number;
  realisticScore: 10;
  gapScore: number;
  gapCategory: 'No Gap' | 'Minor Gap' | 'Moderate Gap' | 'Critical Gap';
  currentScoreCategory: CurrentScoreCategory;
}

export type PerformanceRatingLevel = 'Well Above Required' | 'Above Required' | 'At Required Level' | 'Below Required Level' | 'Well Below Required Level' | 'Not Rated';

export interface OfficerRecord {
  email: string;
  name: string; // I1
  position: string; // I4
  division: string; // I6
  grade: string; // I5
  gradingGroup?: GradingGroup;
  positionNumber?: string;
  spaRating: string; // I12
  performanceRatingLevel: PerformanceRatingLevel;
  capabilityRatings: CapabilityRating[];
  technicalCapabilityGaps: string[];
  leadershipCapabilityGaps: string[];
  ictSkills: string[];
  trainingHistory: TrainingRecord[];
  trainingPreferences: string[];
  urgency: UrgencyLevel;
  nextTrainingDueDate?: string; // YYYY-MM-DD
  misalignmentFlag?: string;
  // New background fields
  age?: number; // I2
  gender?: 'Male' | 'Female';
  dateOfBirth?: string; // I3
  jobQualification?: string; // I8, I11
  commencementDate?: string; // I10
  yearsOfExperience?: number; // I9
  employmentStatus?: string; // I7
  fileNumber?: string;
  // New TNA fields from Section H
  tnaProcessExists?: boolean; // H1
  tnaAssessmentMethods?: string[]; // H3
  tnaProcessDocumented?: boolean; // H4
  tnaDesiredCourses?: string; // H7
  tnaInterestedTopics?: string[]; // H8
  tnaPriorities?: string; // H9
}

export interface AiLearningSolution {
  experiential70: string;
  social20: string;
  formal10: string;
}

export interface AiReportSummary {
    totalGapsDetected: number;
    criticalGapsCount: number;
    staffCategoryDistribution: {
        category: 'Progression Candidate' | 'Training Candidate' | 'Reskilling/Redeployment Candidate' | 'Not Applicable';
        count: number;
    }[];
    topImprovementAreas: {
        area: string;
        reason: string;
    }[];
    concludingIntervention: string;
}

export interface SpaSummary {
    performanceRating: string; // The 1-5 score
    performanceCategory: PerformanceRatingLevel;
    explanation: string;
}

export interface CapabilityAnalysisItem {
    domain: string;
    currentScore: number;
    gapScore: number;
    learningSolution: AiLearningSolution;
    sdgAlignment?: {
        sdgNumber: number;
        sdgName: string;
    }[];
}

export interface AiProgressionAnalysis {
    currentPositionSkills: string[];
    missingCurrentSkills: string[];
    nextPositionSkills: string[];
    progressionSummary: string;
}

export interface AiTalentCardReport {
  introduction: string;
  employeeId: string;
  division: string;
  spaSummary: SpaSummary;
  capabilityAnalysis: CapabilityAnalysisItem[];
  progressionAnalysis: AiProgressionAnalysis;
  summary: AiReportSummary;
}

export type TrainingNeedCategory = 'Qualifications & Experience' | 'Skills' | 'Knowledge';

export type TrainingNeedStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface TrainingFeedback {
    usefulness: 'Very Useful' | 'Useful' | 'Not Useful' | '';
    suggestions: string;
    postTrainingSkillScore: number | '';
    additionalSkillsIdentified: string;
}

export interface TrainingNeedItem {
    id: string;
    perceivedArea: string;
    jobRequirement: string;
    proposedCourse: string;
    institution: string;
    fundingSource: string;
    yearOfCommencement: number;
    remarks: string;
    status: TrainingNeedStatus;
    feedback?: TrainingFeedback;
}

export type PerformanceCategoryType = 'Excellent (86-100%)' | 'Satisfactory (50-85%)' | 'Unsatisfactory (0-49%)' | '';
export type PromotionPotentialType = 'Overdue for Promotion' | 'Promotion Now' | 'Needs Development' | 'Not Promotable' | '';
export type LndFundingSourceType = 'TBD' | 'Internal Budget' | 'External' | 'Donor' | 'Other';

export interface CoreCompetencyItem {
    skill: string;
    year: number | '';
}

export interface EstablishmentRecord {
    positionNumber: string;
    division: string;
    grade: string;
    designation: string;
    occupant: string;
    status: 'Confirmed' | 'Probation' | 'Vacant' | 'Other';
}

export interface IndividualLndPlan {
    id: string;
    officer: EstablishmentRecord;
    age: number | '';
    performanceCategory: PerformanceCategoryType;
    promotionPotential: PromotionPotentialType;
    qualificationChecklist: Record<string, boolean>;
    skillsChecklist: Record<string, boolean>;
    knowledgeChecklist: Record<string, boolean>;
    trainingNeeds: Record<TrainingNeedCategory, TrainingNeedItem[]>;
    coreCompetencies: CoreCompetencyItem[];
}

export interface AiIndividualDevelopmentPlan {
    officerStatus: string;
    age: number;
    performanceCategory: 'Excellent' | 'Satisfactory' | 'Unsatisfactory';
    promotionPotential: 'Overdue for Promotion' | 'Promotion Now' | 'Needs Development' | 'Not Promotable';
    plan: {
      category: TrainingNeedCategory;
      needs: (Omit<TrainingNeedItem, 'status' | 'feedback' | 'id'> & { learningSolution: AiLearningSolution })[];
    }[];
}

// New types for Training Pathways
export interface RecommendedCourse {
    title: string;
    rationale: string;
    deliveryMethod: string;
}

export interface TrainingPathway {
    grade: GradingGroup;
    description: string;
    recommendedCourses: RecommendedCourse[];
}

export interface AiTrainingPathwayReport {
    executiveSummary: string;
    pathwaysByGrade: TrainingPathway[];
}


// New types for Consolidated Training Plan
export interface TrainingPlanItem {
    trainingArea: string;
    targetAudience: GradingGroup | 'All Staff';
    deliveryMethod: 'Workshop' | 'Mentoring' | 'On-the-Job' | 'E-Learning' | 'Secondment';
    priority: 'High' | 'Medium' | 'Low';
    quarter: `Q${1|2|3|4}`;
    year: number;
    estimatedCost: string;
    rationale: string;
}

export interface AiTrainingPlan {
    executiveSummary: string;
    trainingPlan: TrainingPlanItem[];
}

// New types for Automated L&D Recommendations Report
export interface LearningRecommendation {
    skillArea: string;
    questionCode: string;
    rating: number;
    category: 'Low' | 'Fair' | 'High';
    recommendation: AiLearningSolution;
}

export interface OfficerAutomatedLndPlan {
    officerName: string;
    officerPosition: string;
    learningRecommendations: LearningRecommendation[];
}

export interface AiAutomatedLndReport {
    executiveSummary: string;
    officerPlans: OfficerAutomatedLndPlan[];
}

// New type for 70:20:10 interventions
export interface LearningInterventions {
    formal10: string;
    social20: string;
    experiential70: string;
}

// New type for Competency Projection Report
export interface CompetencyProjection {
    totalRatings: number;
    lowCount: number; // 1-6
    fairCount: number; // 7-8
    highCount: number; // 9-10
    perQuestionAnalysis: {
        questionCode: string;
        questionText: string;
        averageRating: number;
        lowCount: number;
        fairCount: number;
        highCount: number;
        totalResponses: number;
        learningInterventions: LearningInterventions;
    }[];
}

// New type for Corporate Plan Analysis Report
export interface CorporatePlanAnalysis {
    averageScore: number;
    classification: 'Low' | 'Average' | 'High';
    topParticipants: { name: string; score: number }[];
    totalRespondents: number;
    highCount: number;
    averageCount: number;
    lowCount: number;
    lowUnderstandingOfficers: { name: string; score: number; division: string }[];
}


// New type for Succession Planning
export interface SuccessionCandidate {
    roleOrPosition: string;
    potentialSuccessors: string[];
    readinessLevel: 'Ready Now' | '1-2 Years' | '3-5 Years' | 'Long-term';
    developmentNeeds: string;
    estimatedTimeline: string;
}

// Generic Report Types
export interface AiReport { executiveSummary: string; keyFindings: any[]; proficiencyAnalysis: any; workforceInsights: any; stakeholderRecommendations: any[]; complianceStatement: string; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }
export interface AiLndReport { executiveSummary: string; organizationalCapabilityOverview: any; competencyGapAnalysis: any; interventionPlan: any; staffProfilingClusters: any; tnaAndLearningEcosystemReview: any; recommendations: any; roiProjectionAndStrategicAlignment: any; appendices?: any; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }
export interface EmployeeTrainingPlan { division: string; positionNumber: string; grade: string; designation: string; occupant: string; proposedCourse: string; institution: string; fundingSource: string; trainingYear: number; }
export interface AiCompetencyReport { executiveSummary: string; capabilityMaturitySummary: string; domains: any[]; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }
export interface AiGapAnalysisReport { executiveSummary: string; prioritizedGaps: any[]; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }

export interface AiFiveYearPlan { executiveSummary: string; trainingPlan: EmployeeTrainingPlan[]; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }
export interface AiTalentSegmentationReport { executiveSummary: string; talentSegments: any[]; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }
export interface AiStrategicRecommendationsReport { executiveSummary: string; estimatedROI: any; strategicAlignment: any; investmentPriorities: any[]; systemsIntegration: any; recommendedFormats: any[]; individualLearningPlans: any; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }
export interface AiWorkforceSnapshotReport { executiveSummary: string; workforceDistribution: any[]; competencyAnalysis: any[]; mostCommonLearningGaps: any[]; recommendedLdFocusAreas: any[]; strategicAlignmentInsights: any; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }

export interface CapabilityItemAnalysis {
    questionCode: string;
    questionText: string;
    capabilityCategory: string;
    averageCurrentRating: number;
    realisticRating: number;
    averageGapScore: number;
    gapCategory: 'No Gap' | 'Minor Gap' | 'Moderate Gap' | 'Critical Gap';
    suggestedLearningMethod: string;
    responseCount: number;
    totalOfficers: number;
}
export interface AiDetailedCapabilityReport { executiveSummary: string; capabilityBreakdown: CapabilityItemAnalysis[]; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }

export type EligibleOfficerStatus = 'Confirmed' | 'Vacant' | 'Displaced' | 'Acting' | 'Unattached' | 'Probation' | 'Other';
export interface EligibleOfficer {
    id: string;
    branch: string;
    positionNumber: string;
    grade: string;
    designation: string;
    occupant: string;
    status: EligibleOfficerStatus;
    cnaSubmission: 'Yes' | 'No';
    beenSentForStudies: 'Yes' | 'No';
    studiedWhere: string;
    courseDetails: string;
    trainingYear: number[];
    attendedFurtherTraining: 'Yes' | 'No';
    notes?: string;
    trainingQuarters?: string;
}
export interface AiEligibleOfficersReport { executiveSummary: string; eligibleOfficers: Omit<EligibleOfficer, 'id'>[]; summary: AiReportSummary; successionPlan: SuccessionCandidate[]; }

export type JobGroup = 'Senior Executive Managers' | 'Supervisors' | 'Administration' | 'Finance' | 'Economics' | 'ICT Officers' | 'Field Officers' | 'Executive Secretaries' | 'Support Staff';
export interface JobGroupTrainingNeed {
    skill: string;
    rationale: string;
    recommendedYear: number;
}
export interface AiJobGroupTrainingNeedsReport {
    executiveSummary: string;
    jobGroupNeeds: {
        jobGroup: JobGroup;
        description: string;
        identifiedNeeds: JobGroupTrainingNeed[];
    }[];
    summary: AiReportSummary;
    successionPlan: SuccessionCandidate[];
}

export type FundingSource = 'Internal Budget' | 'Donor Funded' | 'GoPNG' | 'Other (Specify)';
export interface AnnualTrainingPlanItem {
    division: string;
    fundingSource: FundingSource;
    trainingTitle: string;
    targetAudience: string;
    estimatedCost: string;
    justification: string;
}
export interface AiAnnualTrainingPlan {
    executiveSummary: string;
    year: number;
    trainingPlan: AnnualTrainingPlanItem[];
    summary: AiReportSummary;
    successionPlan: SuccessionCandidate[];
}

export type JobGroupType = '1️⃣ Senior Executive Managers' | '2️⃣ Middle Managers' | '3️⃣ All Line Staff';
export type FundingSourceType = 'TBD' | 'Internal Budget' | 'External' | 'Donor' | 'Other';
export interface DesiredExperienceRecord {
    id: string;
    jobGroup: JobGroupType;
    desiredWorkExperience: string;
    institution: string;
    location: string;
    duration: string;
    fundingSource: FundingSourceType;
    years: number[];
}

export type ThematicProgrammeArea = 'Governance & Policy' | 'Research, Development & Extension' | 'Field Services & Quality Assurance' | 'Business Development & Marketing' | 'Corporate Support Services';

export interface KraRecord {
    id: string;
    name: string;
    description: string;
    thematicProgrammeArea: ThematicProgrammeArea;
    divisions: string[];
    priorityJobGroups: JobGroupType[];
}

export interface KraPlanningRecord {
    id: string;
    kraName: string;
    division: string;
    jobGroup: JobGroupType;
    positionTitle: string;
    location: string;
    year: number;
    remarks: string;
}

// New types for Job Group Knowledge Improvement form
export type JobGroupKnowledgeType = 'Senior Executive Managers' | 'Senior/Middle Managers' | 'Supervisors' | 'All Line Staff' | 'Executive Secretaries';
export type DurationType = 'Less than 6 months' | '6 to 12 months' | '1 to 2 years' | 'More than 2 years';
export type FundingSourceKnowledgeType = 'Department' | 'GoPNG' | 'Donor Agency' | 'Self-funded' | 'Other';

export interface JobGroupKnowledgeRecord {
    id: string;
    jobGroup: JobGroupKnowledgeType;
    educationalProgramme: string;
    institution: string;
    location: string;
    duration: DurationType;
    fundingSource: FundingSourceKnowledgeType;
    years: number[];
}

// New types for Individual L&D Plan Form
export type OfficerStatusType = 'Confirmed' | 'Acting' | 'Contract' | 'Probation' | 'Other';

export type LndFormFundingSource = 'Department' | 'GoPNG' | 'Donor' | 'Self-funded';

export interface LndTrainingNeed {
    id: string;
    perceivedArea: string;
    jobRequirement: string;
    proposedCourse: string;
    institution: string;
    fundingSource: LndFormFundingSource | '';
    yearOfCommencement: number | '';
    remarks: string;
}

// New types for Performance & Promotion Assessment
export type AgeGroupType = '<30' | '30–40' | '41–50' | '>50';
export type PerfLevelType = 'Excellent (86–100%)' | 'Satisfactory (70–85%)' | 'Marginal (50–69%)' | 'Unsatisfactory (0–49%)';

export interface IndividualLndPlanRecord {
    id: string;
    organizationName: string;
    division: string;
    officerName: string;
    positionNumber: string;
    designation: string;
    dateOfBirth: string; // YYYY-MM-DD
    officerStatus: OfficerStatusType | '';
    highestQualification: string;
    commencementDate: string; // YYYY-MM-DD
    gradeLevel: string;
    trainingNeeds: {
        longTerm: LndTrainingNeed[];
        shortTerm: LndTrainingNeed[];
    };
    knowledgeChecklist: Record<string, boolean>;
    otherKnowledge: string[];
    // New Performance & Promotion fields
    ageGroup: AgeGroupType | '';
    performanceLevel: PerfLevelType | '';
    promotionPotential: PromotionPotentialType;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'action' | 'success' | 'error';
  message: string;
}

export type OrgStructure = 'Senior Management' | 'Research & Extension Development Services (REDS)' | 'Extension Services (REDS)' | 'Field Services, Export & Quality Assurance (FSEQA)' | 'Industry, Research & Dev. Services (ICS & REDS)' | 'Industry & Corporate Services (ICS)';

export interface KraThematicMapping {
    orgStructure: OrgStructure;
    thematicProgrammeArea: ThematicProgrammeArea | '';
}

export interface KraJobGroupExample {
    kraArea: string;
    jobExamples: string;
}

export const QUESTION_TEXT_MAPPING: Record<string, string> = {
    'A1': 'I have a clear understanding of the organization\'s Corporate Plan and strategic direction.',
    'A2': 'I understand how my role contributes to the achievement of the organization\'s goals.',
    'A3': 'I am aware of the key national policies (e.g., MTDP IV, Vision 2050) that affect my work.',
    'B1': 'I consistently apply public service values and the Code of Conduct in my work.',
    'B2': 'I am proficient in using the standard operating procedures (SOPs) relevant to my role.',
    'B3': 'I effectively manage my time and prioritize tasks to meet deadlines.',
    'B4': 'I actively seek ways to improve processes and efficiency in my work.',
    'C1': 'I effectively lead and motivate my team to achieve its objectives (for managers/supervisors).',
    'C2': 'I provide constructive feedback and coaching to support the development of my team members.',
    'C3': 'I actively participate in my own professional development and seek learning opportunities.',
    'D1': 'I understand the performance management system (SPA) and my role within it.',
    'D2': 'I set clear and measurable performance objectives for myself/my team.',
    'D3': 'I regularly review performance and address any issues proactively.',
    'E1': 'I am proficient in using standard office software (e.g., Microsoft Word, Excel, Outlook).',
    'E2': 'I am comfortable using specialized software or systems required for my job.',
    'E3': 'I can troubleshoot basic IT issues effectively.',
    'F1': 'I have a clear understanding of the Public Finance Management Act (PFMA).',
    'F2': 'I follow correct procedures for procurement and asset management.',
    'F3': 'I can prepare or contribute to budget submissions for my unit.',
    'F4': 'I understand financial reporting requirements relevant to my role.',
    'F5': 'I adhere to financial delegations and authorities.',
    'F6': 'I can conduct financial acquittals correctly.',
    'F7': 'I am aware of fraud prevention and control measures.',
    'G1': 'I communicate clearly and effectively in writing (e.g., reports, emails).',
    'G2': 'I communicate clearly and effectively when speaking (e.g., meetings, presentations).',
    'G3': 'I build and maintain positive relationships with colleagues and stakeholders.',
    'G4': 'I can effectively handle difficult conversations and resolve conflicts.',
    'G5': 'I represent the organization professionally to external stakeholders.',
    'G6': 'I adhere to established communication protocols and branding guidelines.',
    'H1': 'The organisation has a TNA process to identify staff training needs.',
    'H2': 'Rate out of 10 – My supervisor discusses my training and development needs with me.',
    'H3': 'What methods are used to assess training needs in your agency?',
    'H4': 'The organisation has a documented TNA process that is followed consistently.',
    'H5': 'Rate out of 10 – I am provided with opportunities to attend relevant training.',
    'H6': 'Rate out of 10 – The training I have received has been effective in improving my job performance.',
    'H7': 'List any specific courses you believe would be beneficial for your role.',
    'H8': 'What topics are you most interested in for your professional development?',
    'H9': 'What are your top 1-3 learning and development priorities for the next year?',
};

// NEW TYPES FOR L&D FRAMEWORK REPORT
export interface LndFrameworkItem {
    capabilityCategory: string;
    descriptionAndKRA: string;
    develop70: string;
    help20: string;
    formal10: string;
    whoToAttend: string;
    when: string;
    provider: string;
    budget: string;
}

export interface InductionProgramPlanItem {
    year: number;
    program: string;
    provider: string;
    duration: string;
    numberOfOfficers: number;
    officerNames: string;
    estimatedCost: string;
    grandTotalCost: string;
    comments: string;
}

export interface SkillsAndCompetencyPlanItem {
    year: number;
    program: string;
    provider: string;
    duration: string;
    deliveryMode: string;
    yearOfStudy: string;
    totalOfficers: number;
    unitCost: string;
    estimatedTotalCost: string;
    comments: string;
}

export interface InCountryShortTermPlanTrainingItem {
    year: number;
    profession: string;
    program: string;
    provider: string;
    duration: string;
    yearOfStudy: string;
    totalOfficers: number;
    unitCost: string;
    totalCost: string;
    comments: string;
}

export interface InCountryShortTermPlanDivision {
    division: string;
    trainingItems: InCountryShortTermPlanTrainingItem[];
}

export interface OverseasLongTermPlanTrainingItem {
    officer: string;
    profession: string;
    program: string;
    provider: string;
    duration: string;
    studyYears: number[];
    totalOfficers: number;
    unitCost: string;
    totalCost: string;
    comments: string;
}

export interface OverseasLongTermPlanDivision {
    division: string;
    subDivision?: string;
    trainingItems: OverseasLongTermPlanTrainingItem[];
}

export interface AiLndFrameworkReport {
    executiveSummary: string;
    frameworkPlan: LndFrameworkItem[];
    inductionProgramPlan?: InductionProgramPlanItem[];
    skillsAndCompetencyPlan?: SkillsAndCompetencyPlanItem[];
    inCountryShortTermPlan?: InCountryShortTermPlanDivision[];
    overseasLongTermPlan?: OverseasLongTermPlanDivision[];
}

// New types for Organisational Structure Report
export interface HierarchyNode {
    name: string;
    level: string; // e.g., 'Division', 'Branch', 'Unit'
    manager: string; // Name of person in charge, or 'Vacant'
    staffCount: number;
    cnaParticipationRate: number; // Percentage
    notes?: string;
    children: HierarchyNode[];
}

export interface FunctionalDuplication {
    area: string; // e.g., 'Policy & Planning'
    unitsInvolved: string[];
    observation: string;
    recommendation: string;
}

export interface StructuralGap {
    gapType: 'Critical Vacancy' | 'Low CNA Participation' | 'Missing Tier' | 'Unclear Reporting Line';
    description: string;
    implication: string;
    recommendation: string;
}

export interface AiOrganisationalStructureReport {
    executiveSummary: string;
    adaptedHierarchy: HierarchyNode[];
    functionalDuplications: FunctionalDuplication[];
    structuralGaps: StructuralGap[];
    recommendations: string[];
}
