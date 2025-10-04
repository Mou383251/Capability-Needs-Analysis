import React, { useState, useEffect } from 'react';
import { verifyCredentials } from '../utils/auth';
import { SpinnerIcon, ArrowLeftOnRectangleIcon } from './icons';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

// A simple placeholder for the Papua New Guinea national crest
const PngCrest: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10 L60 25 L90 25 L70 45 L75 75 L50 60 L25 75 L30 45 L10 25 L40 25 Z" fill="#D4AF37" stroke="#A07800" strokeWidth="1"/>
        <path d="M50 15 L58 28 L85 28 L68 45 L72 70 L50 56 L28 70 L32 45 L15 28 L42 28 Z" fill="none" stroke="#FFF" strokeWidth="0.5" opacity="0.5"/>
        <text x="50" y="95" fontFamily="serif" fontSize="10" textAnchor="middle" fill="#FFF" fontWeight="bold">PNG</text>
    </svg>
);

const FAILED_ATTEMPTS_KEY = 'cna_loginFailedAttempts';
const LOCKOUT_UNTIL_KEY = 'cna_lockoutUntil';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [failedAttempts, setFailedAttempts] = useState<number>(() => {
        const attempts = sessionStorage.getItem(FAILED_ATTEMPTS_KEY);
        return attempts ? parseInt(attempts, 10) : 0;
    });

    const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
        const lockoutTime = sessionStorage.getItem(LOCKOUT_UNTIL_KEY);
        if (lockoutTime) {
            const time = parseInt(lockoutTime, 10);
            return time > Date.now() ? time : null;
        }
        return null;
    });
    
    const [countdown, setCountdown] = useState<number>(0);
    const isLocked = lockoutUntil !== null && lockoutUntil > Date.now();

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isLocked && lockoutUntil) {
            const updateCountdown = () => {
                const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
                if (remaining > 0) {
                    setCountdown(remaining);
                    setError(`Too many failed attempts. Please try again in ${remaining} seconds.`);
                } else {
                    setCountdown(0);
                    setLockoutUntil(null);
                    setFailedAttempts(0);
                    sessionStorage.removeItem(FAILED_ATTEMPTS_KEY);
                    sessionStorage.removeItem(LOCKOUT_UNTIL_KEY);
                    setError(null);
                    if (interval) clearInterval(interval);
                }
            };
            
            updateCountdown(); // Initial update
            interval = setInterval(updateCountdown, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLocked, lockoutUntil]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isLocked) {
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const isValid = await verifyCredentials(username, password);
            if (isValid) {
                sessionStorage.removeItem(FAILED_ATTEMPTS_KEY);
                sessionStorage.removeItem(LOCKOUT_UNTIL_KEY);
                setFailedAttempts(0);
                setLockoutUntil(null);
                onLoginSuccess();
            } else {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);
                sessionStorage.setItem(FAILED_ATTEMPTS_KEY, newAttempts.toString());
                
                if (newAttempts >= MAX_ATTEMPTS) {
                     const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
                     setLockoutUntil(lockoutTime);
                     sessionStorage.setItem(LOCKOUT_UNTIL_KEY, lockoutTime.toString());
                } else {
                    setError(`Invalid username or password. You have ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please check the console.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-sky-700"
        >
            <div className="text-center z-10 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wider">
                    Government of Papua New Guinea
                </h1>
            </div>
            
            <div className="w-full max-w-sm z-10">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-8 relative overflow-hidden">
                    <PngCrest className="absolute -top-12 -right-12 w-48 h-48 text-white opacity-5" />
                    <div className="text-center mb-8">
                         <h2 className="text-xl font-semibold text-white">CNA System Login</h2>
                         <p className="text-sm text-white/70 mt-1">Access for Authorized Personnel</p>
                    </div>
                    
                    <p className="text-center text-white/90 text-sm mb-6">
                        Welcome to the CNA System powered app
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1" htmlFor="username">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading || isLocked}
                                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading || isLocked}
                                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                            />
                        </div>

                        {error && <p className="text-sm text-red-300 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}

                        <div>
                             <button
                                type="submit"
                                disabled={isLoading || isLocked}
                                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-900 bg-amber-400 rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-blue-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <>
                                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                        <span>{isLocked ? `Try again in ${countdown}s` : 'Login'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                 <div className="text-center mt-6 text-xs text-white/50">
                    <p>System Custodian: Department of Personnel Management (DPM)</p>
                    <p>&copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
};
