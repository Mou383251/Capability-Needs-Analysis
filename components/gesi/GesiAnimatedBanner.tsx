import React from 'react';

export const GesiAnimatedBanner: React.FC = () => {
    return (
        <div className="bg-amber-800 text-white overflow-hidden flex-shrink-0">
            <div className="py-2 animate-marquee whitespace-nowrap">
                <span className="text-sm font-semibold mx-4">
                    This App is the Property of the Department of Personnel Management – Promoting Gender Equity & Social Inclusion Across the Public Service
                </span>
                 <span className="text-sm font-semibold mx-4">
                    This App is the Property of the Department of Personnel Management – Promoting Gender Equity & Social Inclusion Across the Public Service
                </span>
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: inline-block;
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
};