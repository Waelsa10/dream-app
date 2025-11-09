import React, { useState, useEffect } from 'react';
import { LoadingSpinnerIcon } from './Icons';

const loadingMessages = [
  "Consulting the oracle...",
  "Painting your subconscious...",
  "Decoding the symbols...",
  "Navigating the dreamscape...",
  "Translating whispers from Morpheus...",
  "Weaving the threads of fate..."
];

const LoadingAnalysis: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <LoadingSpinnerIcon className="w-16 h-16 text-indigo-400 mb-6" />
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Analyzing Your Dream</h2>
            <p className="text-slate-400 transition-opacity duration-500">{loadingMessages[messageIndex]}</p>
        </div>
    );
}

export default LoadingAnalysis;
