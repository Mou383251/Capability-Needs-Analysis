import React from 'react';
import { UrgencyLevel, PerformanceRatingLevel, GradingGroup } from '../types';

export const UrgencyBadge: React.FC<{ level: UrgencyLevel }> = ({ level }) => {
  const urgencyStyles: Record<UrgencyLevel, string> = {
    [UrgencyLevel.Low]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    [UrgencyLevel.Medium]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    [UrgencyLevel.High]: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
  };
  return (
    <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${urgencyStyles[level]}`}>
      {level} Urgency
    </span>
  );
};

export const SPARatingBadge: React.FC<{ rating: string, level: PerformanceRatingLevel }> = ({ rating, level }) => {
  if (!level || level === 'Not Rated') {
    return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
            SPA: N/A
        </span>
    );
  }

  const levelStyles: Record<PerformanceRatingLevel, string> = {
    'Well Above Required': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Above Required': 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    'At Required Level': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Below Required Level': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    'Well Below Required Level': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'Not Rated': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${levelStyles[level]}`}>
      {level} ({rating})
    </span>
  );
};

export const GapCategoryBadge: React.FC<{ category: 'No Gap' | 'Minor Gap' | 'Moderate Gap' | 'Critical Gap' }> = ({ category }) => {
    const styles = {
        'No Gap': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        'Minor Gap': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        'Moderate Gap': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        'Critical Gap': 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    };
    return (<span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[category]}`}>{category}</span>);
};

export const GradingGroupBadge: React.FC<{ group: GradingGroup | undefined }> = ({ group }) => {
  if (!group || group === 'Other') return null;

  const groupStyles: Record<GradingGroup, string> = {
    'Junior Officer': 'bg-stone-100 text-stone-800 dark:bg-stone-900/50 dark:text-stone-300',
    'Senior Officer': 'bg-stone-200 text-stone-800 dark:bg-stone-800/60 dark:text-stone-200',
    'Manager': 'bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200',
    'Senior Management': 'bg-slate-300 text-slate-800 dark:bg-slate-700/70 dark:text-slate-100',
    'Other': '',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${groupStyles[group]}`}>
      {group}
    </span>
  );
};