import React from 'react';
import { UsersIcon, ChartPieIcon, DocumentArrowUpIcon, QuestionMarkCircleIcon, SparklesIcon, ScaleIcon, BookOpenIcon, ArrowLeftOnRectangleIcon, AcademicCapIcon } from './icons';

type View = 'organisational' | 'individual' | 'pathways' | 'gesi' | 'cna';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onImportClick: () => void;
  onHelpClick: () => void;
  onShowLndAiAssistant: () => void;
  onLogout: () => void;
}

const NavItemGroup: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        {title && <h3 className="px-3 text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2 mt-6">{title}</h3>}
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-150 rounded-lg ${
        isActive
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-blue-800 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
    >
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onImportClick, onHelpClick, onShowLndAiAssistant, onLogout }) => {
  return (
    <div className="flex flex-col w-64 bg-white dark:bg-blue-900 min-h-screen flex-shrink-0 p-4 border-r border-slate-300 dark:border-blue-800">
        <div className="flex items-center h-16 px-2">
            <div className="p-2 bg-amber-600 rounded-lg mr-3">
                <ChartPieIcon className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-md font-bold text-slate-800 dark:text-slate-100 leading-tight">CNA System</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Automated Planning & Reporting</p>
            </div>
        </div>
        <nav className="flex-grow mt-6">
            <NavItemGroup>
                <NavItem
                    icon={ChartPieIcon}
                    label="Organisational View"
                    isActive={currentView === 'organisational'}
                    onClick={() => setCurrentView('organisational')}
                />
                <NavItem
                    icon={UsersIcon}
                    label="Individual View"
                    isActive={currentView === 'individual'}
                    onClick={() => setCurrentView('individual')}
                />
                <NavItem
                    icon={AcademicCapIcon}
                    label="Training Pathways"
                    isActive={currentView === 'pathways'}
                    onClick={() => setCurrentView('pathways')}
                />
                 <NavItem
                    icon={ScaleIcon}
                    label="GESI Policy Toolkit"
                    isActive={currentView === 'gesi'}
                    onClick={() => setCurrentView('gesi')}
                />
                <NavItem
                    icon={BookOpenIcon}
                    label="CNA Policy Toolkit"
                    isActive={currentView === 'cna'}
                    onClick={() => setCurrentView('cna')}
                />
            </NavItemGroup>

            <NavItemGroup title="Data Management">
                 <NavItem
                    icon={DocumentArrowUpIcon}
                    label="Import Excel Sheet"
                    isActive={false}
                    onClick={onImportClick}
                />
            </NavItemGroup>
            
            <NavItemGroup title="Support">
                 <NavItem
                    icon={QuestionMarkCircleIcon}
                    label="Help & User Guide"
                    isActive={false}
                    onClick={onHelpClick}
                />
                <NavItem
                    icon={SparklesIcon}
                    label="L&D Assistant"
                    isActive={false}
                    onClick={onShowLndAiAssistant}
                />
                <NavItem
                    icon={ArrowLeftOnRectangleIcon}
                    label="Logout"
                    isActive={false}
                    onClick={onLogout}
                />
            </NavItemGroup>
        </nav>
        <div className="mt-auto">
            <div className="px-3 py-4 border-t border-slate-200 dark:border-blue-800 text-xs text-slate-500 dark:text-slate-400">
                <p className="font-semibold">Department of Personnel</p>
                <p>&copy; {new Date().getFullYear()}</p>
            </div>
        </div>
    </div>
  );
};
