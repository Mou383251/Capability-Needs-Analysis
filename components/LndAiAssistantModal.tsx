import React, { useState, useEffect, useRef } from 'react';
import { IndividualLndPlanRecord } from '../types';
import { XIcon, PaperAirplaneIcon, SparklesIcon } from './icons';

interface ModalProps {
    onClose: () => void;
}

type Message = {
    sender: 'user' | 'ai';
    content: string | React.ReactNode;
};

const LND_PLANS_KEY = 'cna_individualLndPlansDraft';

const processUserCommand = (command: string, data: IndividualLndPlanRecord[]): string | React.ReactNode => {
    const lowerCmd = command.toLowerCase();
    
    if (lowerCmd.includes('add') || lowerCmd.includes('new officer')) {
        return "I can help with that. To add a new officer's L&D plan, please use the 'Individual L&D Plan (Manual Form)' in the 'Planning & Forms' menu. It will guide you through all the required fields.";
    }
    
    if (lowerCmd.includes('update') || lowerCmd.includes('edit')) {
        return "To update an officer's plan, please use the 'Individual L&D Plan (Manual Form)', where you can find the officer in the list and click the edit icon.";
    }

    if (lowerCmd.includes('filter') || lowerCmd.includes('find') || lowerCmd.includes('list') || lowerCmd.includes('show')) {
        let results = [...data];
        const filtersApplied: string[] = [];

        if (lowerCmd.includes('confirmed')) {
            results = results.filter(p => p.officerStatus === 'Confirmed');
            filtersApplied.push('Status: Confirmed');
        }
        if (lowerCmd.includes('acting')) {
            results = results.filter(p => p.officerStatus === 'Acting');
            filtersApplied.push('Status: Acting');
        }
        if (lowerCmd.includes('probation')) {
            results = results.filter(p => p.officerStatus === 'Probation');
            filtersApplied.push('Status: Probation');
        }

        if (lowerCmd.includes('studies') && lowerCmd.includes('not')) {
             const officersWithCompletedStudies = new Set<string>();
             data.forEach(plan => {
                 const hasCompleted = Object.values(plan.trainingNeeds || {}).flat().some(need => (need as any).status === 'Completed');
                 if (hasCompleted) {
                     officersWithCompletedStudies.add(plan.id);
                 }
             });
             results = results.filter(p => !officersWithCompletedStudies.has(p.id));
             filtersApplied.push('Has NOT been sent for studies');
        } else if (lowerCmd.includes('studies')) {
            const officersWithCompletedStudies = new Set<string>();
             data.forEach(plan => {
                 const hasCompleted = Object.values(plan.trainingNeeds || {}).flat().some(need => (need as any).status === 'Completed');
                 if (hasCompleted) {
                     officersWithCompletedStudies.add(plan.id);
                 }
             });
             results = results.filter(p => officersWithCompletedStudies.has(p.id));
             filtersApplied.push('Has been sent for studies');
        }

        if (filtersApplied.length === 0) {
            return "I can help you find officers in the L&D plan. What criteria would you like to use? For example: 'Show me all confirmed officers'.";
        }
        
        if (results.length === 0) {
            return `I found no officers matching the criteria: ${filtersApplied.join(', ')}.`;
        }

        return (
            <div>
                <p>Found {results.length} officer(s) matching: {filtersApplied.join(', ')}</p>
                <ul className="list-disc list-inside mt-2 text-sm max-h-48 overflow-y-auto">
                    {results.map(p => <li key={p.id}>{p.officerName} ({p.designation})</li>)}
                </ul>
            </div>
        );
    }
    
    if (lowerCmd.includes('report') || lowerCmd.includes('summary')) {
        const totalOfficers = data.length;
        const byDivision = data.reduce((acc, p) => {
            if(p.division) acc[p.division] = (acc[p.division] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const sentForStudiesCount = data.filter(plan => 
            Object.values(plan.trainingNeeds || {}).flat().some(need => (need as any).status === 'Completed')
        ).length;
        
        const plannedTrainingsPerYear = data.flatMap(p => Object.values(p.trainingNeeds || {}).flat())
            .reduce((acc, need) => {
                const n = need as any;
                if (n.yearOfCommencement) {
                    acc[n.yearOfCommencement] = (acc[n.yearOfCommencement] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);
        
        return (
             <div>
                <p>Here is a summary of the current L&D Plan:</p>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li><strong>Total Officers in Plan:</strong> {totalOfficers}</li>
                    <li><strong>Officers Sent for Studies:</strong> {sentForStudiesCount}</li>
                    <li><strong>Officers per Division:</strong>
                        <ul className="list-['-_'] list-inside ml-4">
                            {Object.entries(byDivision).map(([div, count]) => <li key={div}>{div}: {count}</li>)}
                        </ul>
                    </li>
                    <li><strong>Planned Trainings per Year:</strong>
                         <ul className="list-['-_'] list-inside ml-4">
                            {Object.entries(plannedTrainingsPerYear).sort(([a],[b])=> a.localeCompare(b)).map(([year, count]) => <li key={year}>{year}: {count} trainings</li>)}
                        </ul>
                    </li>
                </ul>
            </div>
        );
    }
    
    if (lowerCmd.includes('export') || lowerCmd.includes('share')) {
        return "Exporting and sharing plans can be done from the 'Individual L&D Plan' form. I can help you find the officers you need first!";
    }

    if (lowerCmd.includes('help')) {
        return "You can ask me to: 'add a new officer', 'update an officer', 'list confirmed officers', or 'show a summary'. How can I assist?";
    }

    return "I'm sorry, I didn't understand that. You can ask for 'help' to see what I can do.";
};


export const LndAiAssistantModal: React.FC<ModalProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [planData, setPlanData] = useState<IndividualLndPlanRecord[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem(LND_PLANS_KEY);
            if (savedData) {
                setPlanData(JSON.parse(savedData));
            }
        } catch (e) {
            console.error("Failed to load L&D plan data for AI Assistant:", e);
        }
        setMessages([{
            sender: 'ai',
            content: "Hello! I'm your AI assistant for managing the combined Training Plan, Eligible Officers List, and Establishment CNA Checklist for any Branch or Division. How can I help you today? (e.g., 'show a summary')"
        }]);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        setTimeout(() => {
            const aiResponse: Message = { sender: 'ai', content: processUserCommand(inputValue, planData) };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col h-[70vh]">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-amber-500" />
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">L&D AI Assistant</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close AI Assistant">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>}
                            <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-white dark:bg-slate-800' : 'bg-amber-600 text-white'}`}>
                                <div className="prose prose-sm dark:prose-invert max-w-none">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
                            <div className="max-w-md p-3 rounded-lg bg-white dark:bg-slate-800">
                               <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                               </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </main>

                <footer className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask me to find officers or show a summary..."
                            className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading}
                            className="p-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-slate-400"
                            aria-label="Send message"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};