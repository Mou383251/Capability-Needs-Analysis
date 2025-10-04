import React, { useState, useEffect, useMemo } from 'react';
import { KraPlanningRecord, JobGroupType } from '../types';
import { KRA_DATA } from '../data/kra';
import { XIcon, PresentationChartLineIcon } from './icons';
import { ChartComponent } from './charts';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToXlsx, ReportData, copyForSheets, exportToCsv } from '../utils/export';

interface ReportProps {
    onClose: () => void;
}

const DRAFT_STORAGE_KEY = 'cna_kra_planning_draft';

type SortConfig = {
    key: keyof KraPlanningRecord;
    direction: 'ascending' | 'descending';
} | null;

const KraDashboard: React.FC<ReportProps> = ({ onClose }) => {
    const [planningRecords, setPlanningRecords] = useState<KraPlanningRecord[]>([]);
    const [filters, setFilters] = useState({
        division: '',
        kra: '',
        year: '',
        jobGroup: ''
    });
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (savedDraft) {
                setPlanningRecords(JSON.parse(savedDraft));
            }
        } catch (e) {
            console.error("Failed to load KRA staffing plan from storage:", e);
        }
    }, []);

    const jobGroupsPerKraChartData = useMemo(() => {
        const labels = KRA_DATA.map(kra => kra.name);
        const data = KRA_DATA.map(kra => kra.priorityJobGroups.length);
        return {
            labels,
            datasets: [{
                label: 'Number of Priority Job Groups',
                data,
                backgroundColor: 'rgba(22, 163, 74, 0.7)',
                borderColor: 'rgba(22, 163, 74, 1)',
                borderWidth: 1,
            }]
        };
    }, []);

    const jobTitlesPerDivisionChartData = useMemo(() => {
        const divisionCounts = planningRecords.reduce((acc, record) => {
            acc[record.division] = (acc[record.division] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const labels = Object.keys(divisionCounts);
        const data = Object.values(divisionCounts);
        return {
            labels,
            datasets: [{
                label: 'Number of Planned Job Titles',
                data,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            }]
        };
    }, [planningRecords]);

    const filteredAndSortedRecords = useMemo(() => {
        let sortedRecords = [...planningRecords];

        if (sortConfig !== null) {
            sortedRecords.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return sortedRecords.filter(record => {
            return (
                (filters.division ? record.division === filters.division : true) &&
                (filters.kra ? record.kraName === filters.kra : true) &&
                (filters.year ? record.year === parseInt(filters.year) : true) &&
                (filters.jobGroup ? record.jobGroup === filters.jobGroup : true)
            );
        });
    }, [planningRecords, filters, sortConfig]);

    const requestSort = (key: keyof KraPlanningRecord) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const uniqueFilterOptions = useMemo(() => {
        return {
            divisions: [...new Set(planningRecords.map(r => r.division))].sort(),
            kras: [...new Set(planningRecords.map(r => r.kraName))].sort(),
            years: [...new Set(planningRecords.map(r => r.year))].sort((a: number, b: number) => a - b),
            jobGroups: [...new Set(planningRecords.map(r => r.jobGroup))].sort(),
        };
    }, [planningRecords]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const getReportDataForExport = (): ReportData => {
        const tableHeaders = ['KRA', 'Division', 'Job Group', 'Position Title', 'Location', 'Year', 'Remarks'];
        const tableRows = filteredAndSortedRecords.map(rec => [rec.kraName, rec.division, rec.jobGroup, rec.positionTitle, rec.location, rec.year, rec.remarks]);
        return {
            title: 'KRA Staffing Plan Export',
            sections: [{ title: 'KRA Staffing Plan Data', content: [{ type: 'table', headers: tableHeaders, rows: tableRows }] }]
        };
    };

    const handleExport = (format: 'pdf' | 'xlsx' | 'csv' | 'sheets') => {
        const reportData = getReportDataForExport();
        if (format === 'pdf') exportToPdf(reportData);
        else if (format === 'xlsx') exportToXlsx(reportData);
        else if (format === 'csv') exportToCsv(reportData);
        else if (format === 'sheets') copyForSheets(reportData).then(alert).catch(alert);
    };

    const SortableHeader: React.FC<{ columnKey: keyof KraPlanningRecord, children: React.ReactNode }> = ({ columnKey, children }) => {
        const isSorted = sortConfig?.key === columnKey;
        const sortIcon = isSorted ? (sortConfig?.direction === 'ascending' ? '▲' : '▼') : '';
        return (
            <th className="p-2 cursor-pointer" onClick={() => requestSort(columnKey)}>
                {children} {sortIcon}
            </th>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <PresentationChartLineIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KRA Dashboard & Summary</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report"><XIcon className="w-6 h-6" /></button>
                </header>
                <main className="overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold mb-2">Job Groups per KRA</h3>
                            <div className="relative h-64"><ChartComponent type="bar" data={jobGroupsPerKraChartData} /></div>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold mb-2">Planned Job Titles per Division</h3>
                            <div className="relative h-64"><ChartComponent type="bar" data={jobTitlesPerDivisionChartData} /></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-4">KRA Thematic Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {KRA_DATA.map(kra => (
                                <div key={kra.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-bold text-blue-600 dark:text-blue-400">{kra.name}</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{kra.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-semibold">Searchable Staffing Plan ({filteredAndSortedRecords.length} records)</h3>
                             <ExportMenu onExport={handleExport} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <select name="kra" value={filters.kra} onChange={handleFilterChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"><option value="">All KRAs</option>{uniqueFilterOptions.kras.map(o => <option key={o} value={o}>{o}</option>)}</select>
                            <select name="division" value={filters.division} onChange={handleFilterChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"><option value="">All Divisions</option>{uniqueFilterOptions.divisions.map(o => <option key={o} value={o}>{o}</option>)}</select>
                            <select name="jobGroup" value={filters.jobGroup} onChange={handleFilterChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"><option value="">All Job Groups</option>{uniqueFilterOptions.jobGroups.map(o => <option key={o} value={o}>{o}</option>)}</select>
                            <select name="year" value={filters.year} onChange={handleFilterChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"><option value="">All Years</option>{uniqueFilterOptions.years.map(o => <option key={o} value={o}>{o}</option>)}</select>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-200 dark:bg-slate-700/50">
                                    <tr>
                                        <SortableHeader columnKey="kraName">KRA</SortableHeader>
                                        <SortableHeader columnKey="division">Division</SortableHeader>
                                        <SortableHeader columnKey="jobGroup">Job Group</SortableHeader>
                                        <SortableHeader columnKey="positionTitle">Position Title</SortableHeader>
                                        <SortableHeader columnKey="location">Location</SortableHeader>
                                        <SortableHeader columnKey="year">Year</SortableHeader>
                                        <SortableHeader columnKey="remarks">Remarks</SortableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedRecords.map(rec => (
                                        <tr key={rec.id} className="border-b border-slate-200 dark:border-slate-700">
                                            <td className="p-2">{rec.kraName}</td>
                                            <td className="p-2">{rec.division}</td>
                                            <td className="p-2">{rec.jobGroup}</td>
                                            <td className="p-2 font-semibold">{rec.positionTitle}</td>
                                            <td className="p-2">{rec.location}</td>
                                            <td className="p-2 text-center">{rec.year}</td>
                                            <td className="p-2">{rec.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredAndSortedRecords.length === 0 && <div className="text-center p-8 text-slate-500">No records match the current filters.</div>}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export { KraDashboard };
