import { KraRecord, ThematicProgrammeArea, OrgStructure, KraJobGroupExample } from '../types';

export const ORG_STRUCTURE_ITEMS: OrgStructure[] = [
    'Senior Management',
    'Research & Extension Development Services (REDS)',
    'Extension Services (REDS)',
    'Field Services, Export & Quality Assurance (FSEQA)',
    'Industry, Research & Dev. Services (ICS & REDS)',
    'Industry & Corporate Services (ICS)'
];

export const KRA_JOB_GROUP_EXAMPLES: KraJobGroupExample[] = [
    { kraArea: 'Senior Management', jobExamples: 'Managers & Above' },
    { kraArea: 'Research & Development', jobExamples: 'Agronomist, Experimentalist, Entomologist, Pathologist, Breeder, Data Entry Processors, Research Officers, Data Analysts' },
    { kraArea: 'Economics', jobExamples: 'Economic Analysts, Statisticians, Data Entry Officers, Project Officers, Marketing & Research Analysts' },
    { kraArea: 'Extension Services', jobExamples: 'Liaison & Facilitation Officers, Liaison & Extension Officers, Cocoa Breeders' },
    { kraArea: 'Field Services', jobExamples: 'Field Officers, Export & Quality Assurance Officers' },
    { kraArea: 'Business Dev & Marketing', jobExamples: 'Marketing Officer, Business Development Officer, Plantation Advisor, Freight Surety Coordinator, Cocoa Credit Scheme & Cooperative Officer' },
    { kraArea: 'Corporate Services', jobExamples: 'HR, Learning & Capacity Dev, Finance, Payroll, Accounts, Admin, Legal, Internal Auditor' },
    { kraArea: 'Support Services', jobExamples: 'ICT, Librarian, Facilities & Logistics, Receptionist, Driver, Security, PA, Admin, Cashier, Typist, Artisan, Gardener, Janitor' },
];

export const KRA_DATA: KraRecord[] = [
    {
        id: 'KRA1_NEW',
        name: '1️⃣ Enabling Environment',
        description: 'To create and maintain a conducive policy, legal, and regulatory framework that supports a competitive and fair cocoa industry.',
        thematicProgrammeArea: 'Governance & Policy',
        divisions: ['Executive'],
        priorityJobGroups: ['1️⃣ Senior Executive Managers']
    },
    {
        id: 'KRA2_NEW',
        name: '2️⃣ Productivity Improvement',
        description: 'To increase the yield and quality of cocoa through research, development, and the dissemination of improved farming technologies and practices.',
        thematicProgrammeArea: 'Research, Development & Extension',
        divisions: ['Research, Development & Extension'],
        priorityJobGroups: ['2️⃣ Middle Managers', '3️⃣ All Line Staff']
    },
    {
        id: 'KRA3_NEW',
        name: '3️⃣ Extension Services',
        description: 'To provide effective, accessible, and responsive extension and advisory services to all cocoa farmers to improve their skills and knowledge.',
        thematicProgrammeArea: 'Research, Development & Extension',
        divisions: ['Research, Development & Extension'],
        priorityJobGroups: ['2️⃣ Middle Managers', '3️⃣ All Line Staff']
    },
    {
        id: 'KRA4_NEW',
        name: '4️⃣ Scale and Sustainable Production',
        description: 'To promote the expansion of sustainable cocoa production systems, ensuring long-term environmental and economic viability for farmers.',
        thematicProgrammeArea: 'Field Services & Quality Assurance',
        divisions: ['Field Services, Export & Quality Assurance'],
        priorityJobGroups: ['1️⃣ Senior Executive Managers', '2️⃣ Middle Managers']
    },
    {
        id: 'KRA5_NEW',
        name: '5️⃣ Business Development & Marketing',
        description: 'To develop new markets, enhance value chains, and improve marketing strategies to increase profitability for PNG cocoa producers.',
        thematicProgrammeArea: 'Business Development & Marketing',
        divisions: ['Corporate Services', 'Research, Development & Extension'],
        priorityJobGroups: ['1️⃣ Senior Executive Managers']
    },
    {
        id: 'KRA6_NEW',
        name: '6️⃣ Corporate Support Services',
        description: 'To provide efficient and effective corporate services, including HR, finance, and IT, to support the core functions of the organization.',
        thematicProgrammeArea: 'Corporate Support Services',
        divisions: ['Corporate Services'],
        priorityJobGroups: ['2️⃣ Middle Managers', '3️⃣ All Line Staff']
    },
];