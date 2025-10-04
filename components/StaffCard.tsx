import React from 'react';
import { OfficerRecord } from '../types';
import { UserCircleIcon, ExclamationTriangleIcon, SparklesIcon, SpinnerIcon, CalendarDaysIcon } from './icons';
import { UrgencyBadge, SPARatingBadge, GradingGroupBadge } from './Badges';

interface StaffCardProps {
  officer: OfficerRecord;
  onViewSummary: (officer: OfficerRecord) => void;
  onSuggestTraining: (officer: OfficerRecord) => void;
  isLoadingSuggestions: boolean;
}

const SkillTag: React.FC<{ skill: string; color?: string }> = ({ skill, color }) => (
    <span className={`inline-block rounded-md px-2 py-1 text-xs font-semibold mr-2 mb-2 ${color || 'bg-gray-200 dark:bg-blue-800 text-gray-700 dark:text-gray-200'}`}>
        {skill}
    </span>
);

const DueDateBadge: React.FC<{ dueDate: string }> = ({ dueDate }) => {
    const now = new Date();
    // To prevent issues with timezones, parse date as YYYY-MM-DD UTC
    const dueParts = dueDate.split('-').map(Number);
    const due = new Date(Date.UTC(dueParts[0], dueParts[1] - 1, dueParts[2]));

    // Get today's date in UTC at midnight
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200 flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4" />
                Training Overdue
            </span>
        );
    }
    
    // Let's use 180 days as "upcoming"
    if (diffDays <= 180) {
        return (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1.5 animate-pulse">
                <CalendarDaysIcon className="w-4 h-4" />
                Due in {diffDays} days
            </span>
        );
    }

    return null; // Not due soon, don't render anything
};


export const StaffCard: React.FC<StaffCardProps> = ({ officer, onViewSummary, onSuggestTraining, isLoadingSuggestions }) => {
  const allRatings = officer.capabilityRatings;
  const avgCapabilityScore = allRatings.length > 0
    ? allRatings.reduce((sum, r) => sum + r.currentScore, 0) / allRatings.length
    : 0;

  const scoreCurrent = avgCapabilityScore;
  const scoreRealistic = 10;
  const scoreGap = scoreRealistic - scoreCurrent;
  const scoreGapPercentage = scoreGap > 0 ? (scoreGap / 10) * 100 : 0;

  const getGapCategory = (gapScore: number) => {
    if (gapScore <= 1) return { text: 'No Gap', color: 'text-green-600 dark:text-green-400' };
    if (gapScore <= 2) return { text: 'Minor Gap', color: 'text-amber-600 dark:text-amber-400' };
    if (gapScore <= 5) return { text: 'Moderate Gap', color: 'text-orange-600 dark:text-orange-400' };
    return { text: 'Critical Gap', color: 'text-red-600 dark:text-red-400' };
  };

  const gapCategory = getGapCategory(scoreGap);

  const allPreferences = [
      ...(officer.trainingPreferences || []),
      ...(officer.tnaInterestedTopics || [])
  ];
  const hasPreferences = allPreferences.length > 0;
  const hasDesiredCourses = officer.tnaDesiredCourses && officer.tnaDesiredCourses.trim() !== '';
  const hasPriorities = officer.tnaPriorities && officer.tnaPriorities.trim() !== '';
  const hasAnyNeeds = hasPreferences || hasDesiredCourses || hasPriorities;


  return (
    <div className="bg-white dark:bg-blue-900 rounded-lg shadow-md border border-gray-200 dark:border-blue-800 p-6 mb-4 flex flex-col">
        {officer.misalignmentFlag && (
            <div className="p-3 mb-4 -mx-6 -mt-6 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-t-lg flex items-start gap-3 border-b border-yellow-200 dark:border-yellow-800">
                <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-sm">Potential Misalignment Detected</h4>
                    <p className="text-xs">{officer.misalignmentFlag}</p>
                </div>
            </div>
        )}
        <div className="flex-grow">
            <div className="flex justify-between items-start mb-4">
                <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{officer.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{officer.position} - {officer.grade}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{officer.email}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {officer.nextTrainingDueDate && <DueDateBadge dueDate={officer.nextTrainingDueDate} />}
                    <GradingGroupBadge group={officer.gradingGroup} />
                    <UrgencyBadge level={officer.urgency} />
                    <SPARatingBadge rating={officer.spaRating} level={officer.performanceRatingLevel} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Column 1: Gaps & Skills */}
                <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-blue-800 pb-1">Capability Gaps</h4>
                    <div className="mt-2">
                    <h5 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1">Technical</h5>
                    {officer.technicalCapabilityGaps.length > 0 ? officer.technicalCapabilityGaps.map(skill => <SkillTag key={skill} skill={skill} />) : <p className="text-sm text-gray-500 dark:text-gray-400">None identified.</p>}
                    </div>
                    <div className="mt-3">
                    <h5 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1">Leadership</h5>
                    {officer.leadershipCapabilityGaps.length > 0 ? officer.leadershipCapabilityGaps.map(skill => <SkillTag key={skill} skill={skill} />) : <p className="text-sm text-gray-500 dark:text-gray-400">None identified.</p>}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-blue-800 pb-1">ICT Skills</h4>
                    {officer.ictSkills.length > 0 ? (
                        officer.ictSkills.map(skill => <SkillTag key={skill} skill={skill} />)
                    ) : (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md flex items-start gap-3">
                            <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 text-amber-500 flex-shrink-0" />
                            <div>
                                <h5 className="text-sm font-semibold text-amber-800 dark:text-amber-200">System Suggestion: Basic ICT Skills Needed</h5>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                    No specific ICT skills are listed. In the modern workplace, all officers should have foundational digital literacy.
                                </p>
                                <div className="mt-2">
                                    <SkillTag skill="Microsoft Office Suite" color="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200" />
                                    <SkillTag skill="Email & Online Communication" color="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200" />
                                    <SkillTag skill="Basic Troubleshooting" color="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                </div>
                
                {/* Column 2: Training */}
                <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-blue-800 pb-1">Training History</h4>
                    {officer.trainingHistory.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {officer.trainingHistory.map(training => (
                        <li key={training.courseName}>
                            {training.courseName} <span className="text-gray-400 dark:text-gray-500">({training.completionDate})</span>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No training history recorded.</p>
                    )}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-blue-800 pb-1">Training Preferences &amp; Self-Identified Needs</h4>
                    {!hasAnyNeeds ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">None specified.</p>
                    ) : (
                        <div className="space-y-3">
                            {hasPreferences && (
                                <div>
                                    <h5 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1">Preferences &amp; Topics of Interest</h5>
                                    {allPreferences.map(pref => <SkillTag key={pref} skill={pref} />)}
                                </div>
                            )}
                            {hasDesiredCourses && (
                                <div>
                                    <h5 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1">Desired Courses (from CNA Section H)</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{officer.tnaDesiredCourses}</p>
                                </div>
                            )}
                             {hasPriorities && (
                                <div>
                                    <h5 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1">Top Priorities (from CNA Section H)</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{officer.tnaPriorities}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
      
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-blue-800 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex-grow">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">Overall Capability Score</h4>
                <div className="w-full bg-gray-200 dark:bg-blue-800 rounded-full h-2.5">
                    <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: `${scoreCurrent * 10}%` }}></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                    <span>Current Avg: <b className="text-gray-700 dark:text-gray-200">{scoreCurrent.toFixed(2)}/10</b></span>
                     <span className={`font-semibold ${gapCategory.color}`}>
                        Gap: {scoreGap.toFixed(2)} ({gapCategory.text})
                    </span>
                </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                 <button 
                    onClick={() => onViewSummary(officer)} 
                    className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white dark:bg-blue-800 dark:text-gray-200 border border-gray-300 dark:border-blue-700 rounded-md hover:bg-gray-100 dark:hover:bg-blue-700 transition-colors"
                >
                    View L&amp;D Plan
                </button>
                 <button 
                    onClick={() => onSuggestTraining(officer)} 
                    disabled={isLoadingSuggestions}
                    className="px-3 py-1.5 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                >
                    {isLoadingSuggestions ? (
                        <>
                            <SpinnerIcon className="w-4 h-4 animate-spin" />
                            <span>Loading...</span>
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-4 h-4" />
                            <span>Talent Card</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};