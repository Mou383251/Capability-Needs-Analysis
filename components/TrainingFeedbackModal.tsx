import React, { useState, useEffect } from 'react';
import { TrainingFeedback, TrainingNeedItem } from '../types';
import { XIcon } from './icons';

interface ModalProps {
    need: TrainingNeedItem;
    onSave: (feedback: TrainingFeedback) => void;
    onClose: () => void;
}

const initialFeedbackState: TrainingFeedback = {
    usefulness: '',
    suggestions: '',
    postTrainingSkillScore: '',
    additionalSkillsIdentified: '',
};

const usefulnessOptions: TrainingFeedback['usefulness'][] = ['Very Useful', 'Useful', 'Not Useful'];

const FormField: React.FC<{ label: string, required?: boolean, children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

export const TrainingFeedbackModal: React.FC<ModalProps> = ({ need, onSave, onClose }) => {
    const [feedback, setFeedback] = useState<TrainingFeedback>(need.feedback || initialFeedbackState);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFeedback(need.feedback || initialFeedbackState);
    }, [need]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFeedback(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setError(null);
        if (!feedback.usefulness) {
            setError("Please rate the training's usefulness.");
            return;
        }
        if (feedback.postTrainingSkillScore !== '' && (Number(feedback.postTrainingSkillScore) < 1 || Number(feedback.postTrainingSkillScore) > 10)) {
            setError("Post-Training Skill Score must be between 1 and 10.");
            return;
        }
        onSave({
            ...feedback,
            postTrainingSkillScore: feedback.postTrainingSkillScore === '' ? '' : Number(feedback.postTrainingSkillScore),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Training Feedback & Reassessment</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{need.proposedCourse}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close feedback dialog">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <main className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <FormField label="How useful was this training for your role?" required>
                        <select name="usefulness" value={feedback.usefulness} onChange={handleInputChange} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                            <option value="" disabled>Select a rating...</option>
                            {usefulnessOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </FormField>

                    <FormField label="After the training, how would you rate your skill in this area? (1-10)">
                        <input
                            type="number"
                            name="postTrainingSkillScore"
                            value={feedback.postTrainingSkillScore}
                            onChange={handleInputChange}
                            min="1"
                            max="10"
                            className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                            placeholder="Enter a score from 1 to 10"
                        />
                    </FormField>

                    <FormField label="Suggestions for Improvement">
                        <textarea
                            name="suggestions"
                            value={feedback.suggestions}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                            placeholder="e.g., More practical exercises, better materials..."
                        />
                    </FormField>
                    
                    <FormField label="List any additional skills you believe should now be included in your plan">
                         <textarea
                            name="additionalSkillsIdentified"
                            value={feedback.additionalSkillsIdentified}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                            placeholder="e.g., Advanced Data Analysis, Public Speaking..."
                        />
                    </FormField>

                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                </main>
                <footer className="flex justify-end gap-3 p-4 bg-slate-200/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Save Feedback
                    </button>
                </footer>
            </div>
        </div>
    );
};
