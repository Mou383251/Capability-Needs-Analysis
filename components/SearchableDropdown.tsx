import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './icons';

interface Option {
    value: string;
    label: string;
}

interface SearchableDropdownProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder = 'Search...' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = query
        ? options.filter(option => option.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setQuery('');
        setIsOpen(false);
    };

    const displayValue = selectedOption ? selectedOption.label : query;

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    value={displayValue}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (value) {
                             onChange(''); // Clear the selection if user starts typing
                        }
                        if (!isOpen) {
                            setIsOpen(true);
                        }
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                         if (selectedOption) {
                            setQuery(''); // Clear query to show all options when focusing a selected item
                        }
                    }}
                    placeholder={placeholder}
                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                />
                 <ChevronDownIcon className={`w-5 h-5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto" role="listbox">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                            <li
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600"
                                role="option"
                                aria-selected={value === option.value}
                            >
                                {option.label}
                            </li>
                        ))
                    ) : (
                        <li className="px-3 py-2 text-sm text-slate-500">No results found.</li>
                    )}
                </ul>
            )}
        </div>
    );
};
