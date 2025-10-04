import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-300 dark:border-gray-700 pb-2">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-2">
            {children}
        </div>
    </div>
);

const Quote: React.FC<{ source: string; children: React.ReactNode }> = ({ source, children }) => (
    <blockquote className="border-l-4 border-amber-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4">
        <p>{children}</p>
        <cite className="block text-right mt-2 text-xs not-italic font-semibold">{source}</cite>
    </blockquote>
);

export const GesiOverview: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Section title="Purpose of the GESI Policy">
                <p>
                    The National Public Service Gender Equity and Social Inclusion (GESI) Policy provides a framework to guide all government agencies in integrating GESI principles into their policies, programs, and workplace practices. Its purpose is to ensure that the public service is fair, equitable, and representative of the diverse population of Papua New Guinea.
                </p>
                <p>
                    By promoting equal participation and benefit for all individuals, regardless of gender, disability, ethnicity, or social status, the policy aims to improve service delivery, enhance organizational performance, and contribute to national development goals.
                </p>
            </Section>

            <Section title="Background">
                <p>
                    The Government of Papua New Guinea is committed to upholding the principles of equality and social justice as enshrined in the National Constitution. The GESI Policy builds upon this commitment and aligns with international conventions, including the Universal Declaration of Human Rights (UDHR) and the Convention on the Elimination of All Forms of Discrimination against Women (CEDAW).
                </p>
                <p>
                    This policy addresses the systemic barriers that have historically limited the participation of women, persons with disabilities, and other marginalized groups in the public sector. It provides a clear mandate for all departments and agencies to proactively address these issues through targeted strategies and mainstreaming efforts.
                </p>
            </Section>
            
             <Section title="Constitutional & Human Rights Foundations">
                <Quote source="The Constitution of the Independent State of Papua New Guinea (Section 55)">
                    "...all citizens have the same rights, privileges, obligations and duties irrespective of race, tribe, place of origin, political opinion, colour, creed, religion or sex."
                </Quote>
                <Quote source="Universal Declaration of Human Rights (Article 1)">
                    "All human beings are born free and equal in dignity and rights."
                </Quote>
            </Section>

            <Section title="Guiding Principles">
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Equity and Equality:</strong> Ensuring fair treatment and equal opportunities for all public servants and citizens accessing government services.</li>
                    <li><strong>Social Inclusion:</strong> Actively involving and empowering all groups, especially the marginalized, in decision-making processes that affect their lives.</li>
                    <li><strong>Participation:</strong> Guaranteeing that all individuals have the right to participate fully in the social, economic, and political life of the nation.</li>
                    <li><strong>Non-Discrimination:</strong> Prohibiting any form of discrimination and promoting a culture of respect and dignity within the public service.</li>
                    <li><strong>Accountability:</strong> Requiring all levels of government to be accountable for implementing GESI principles and achieving measurable outcomes.</li>
                </ul>
            </Section>
        </div>
    );
};