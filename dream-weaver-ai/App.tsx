import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { DreamState, type DreamData, type ChatMessage } from './types';
import { generateDreamAnalysis, getChatResponse } from './services/geminiService';
import VoiceRecorder from './components/VoiceRecorder';
import DreamDisplay from './components/DreamDisplay';
import LoadingAnalysis from './components/LoadingAnalysis';
import { StarsIcon, SearchIcon, MicrophoneIcon } from './components/Icons';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
}

const App: React.FC = () => {
  const [dreamState, setDreamState] = useState<DreamState>(DreamState.IDLE);
  const [allDreams, setAllDreams] = useState<DreamData[]>([]);
  const [activeDream, setActiveDream] = useState<DreamData | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    try {
      const storedDreams = localStorage.getItem('dreamJournal');
      if (storedDreams) {
        setAllDreams(JSON.parse(storedDreams));
      }
    } catch (e) {
      console.error("Failed to load dreams from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('dreamJournal', JSON.stringify(allDreams));
    } catch (e) {
      console.error("Failed to save dreams to localStorage", e);
    }
  }, [allDreams]);

  const resetToJournal = () => {
    setDreamState(DreamState.IDLE);
    setActiveDream(null);
    setChatHistory([]);
    setError(null);
    setTranscript('');
    finalTranscriptRef.current = '';
  };

  const handleStartRecording = () => {
    if (!recognition) {
      setError("Speech recognition is not supported in your browser.");
      setDreamState(DreamState.ERROR);
      return;
    }
    setTranscript('');
    finalTranscriptRef.current = '';
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscriptChunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptChunk += transcriptChunk;
        } else {
          interimTranscript += transcriptChunk;
        }
      }
      finalTranscriptRef.current += finalTranscriptChunk;
      setTranscript(finalTranscriptRef.current + interimTranscript);
    };
    recognition.start();
    setDreamState(DreamState.RECORDING);
  };

  const handleStopRecording = useCallback(async () => {
    if (recognition) {
        recognition.stop();
    }
    setDreamState(DreamState.ANALYZING);

    const finalTranscript = finalTranscriptRef.current.trim();
    if (finalTranscript.length < 10) {
        setError("Dream recording is too short. Please try again and describe your dream in more detail.");
        setDreamState(DreamState.ERROR);
        return;
    }

    try {
      const result = await generateDreamAnalysis(finalTranscript);
      const newDream: DreamData = {
          id: new Date().toISOString(),
          transcript: finalTranscript,
          ...result,
          tags: [],
          createdAt: Date.now(),
      };
      setActiveDream(newDream);
      setDreamState(DreamState.COMPLETE);
    } catch (e) {
      console.error(e);
      setError("Failed to analyze the dream. The spirits are troubled. Please try again.");
      setDreamState(DreamState.ERROR);
    }
  }, []);

  const handleSaveDream = (updatedDream: DreamData) => {
    setAllDreams(prevDreams => {
        const existingIndex = prevDreams.findIndex(d => d.id === updatedDream.id);
        if (existingIndex > -1) {
            const newDreams = [...prevDreams];
            newDreams[existingIndex] = updatedDream;
            return newDreams;
        }
        return [updatedDream, ...prevDreams];
    });
    resetToJournal();
  };
  
  const handleViewDream = (dream: DreamData) => {
      setActiveDream(dream);
      setChatHistory([]);
      setDreamState(DreamState.COMPLETE);
  };

  const handleSendMessage = async (message: string) => {
    if (!activeDream) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: message }];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const modelResponse = await getChatResponse(activeDream.transcript, activeDream.interpretation, newHistory);
      setChatHistory([...newHistory, { role: 'model', text: modelResponse }]);
    } catch (e) {
      console.error(e);
      setChatHistory([...newHistory, { role: 'model', text: "I'm sorry, I lost my train of thought. Could you ask that again?" }]);
    } finally {
      setIsChatLoading(false);
    }
  };
  
  const filteredDreams = useMemo(() => {
      if (!searchTerm) {
          return [...allDreams].sort((a, b) => b.createdAt - a.createdAt);
      }
      const lowercasedTerm = searchTerm.toLowerCase();
      return allDreams
        .filter(dream => dream.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm)))
        .sort((a, b) => b.createdAt - a.createdAt);
  }, [allDreams, searchTerm]);

  const renderContent = () => {
    switch (dreamState) {
      case DreamState.RECORDING:
        return <VoiceRecorder isRecording={true} stopRecording={handleStopRecording} transcript={transcript} />;
      case DreamState.ANALYZING:
        return <LoadingAnalysis />;
      case DreamState.COMPLETE:
        if (activeDream) {
          return <DreamDisplay
            dreamData={activeDream}
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            isChatLoading={isChatLoading}
            onSaveDream={handleSaveDream}
            />;
        }
        return null;
      case DreamState.ERROR:
        return (
          <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold text-red-400 mb-4">An Error Occurred</h2>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={resetToJournal}
              className="px-6 py-3 bg-indigo-600 rounded-full text-white font-semibold hover:bg-indigo-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case DreamState.IDLE:
      default:
        return (
            <div className="p-4 sm:p-6 h-full flex flex-col">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search by tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                    <button
                        onClick={handleStartRecording}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full text-white font-semibold hover:from-indigo-500 hover:to-purple-600 transition-all transform hover:scale-105"
                    >
                        <MicrophoneIcon className="w-5 h-5" />
                        Record New Dream
                    </button>
                </div>
                {filteredDreams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                        {filteredDreams.map(dream => (
                            <div key={dream.id} onClick={() => handleViewDream(dream)} className="bg-slate-800 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all group">
                                <img src={dream.imageUrl} alt="Dream visualization" className="w-full h-40 object-cover" />
                                <div className="p-4">
                                    <p className="text-sm text-slate-400 truncate group-hover:text-slate-300 transition-colors">{new Date(dream.createdAt).toLocaleDateString()}</p>
                                    <p className="text-slate-200 mt-2 text-sm italic line-clamp-2">"{dream.transcript}"</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {dream.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="bg-slate-700 text-indigo-300 text-xs font-mono px-2 py-1 rounded">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center flex-grow flex flex-col items-center justify-center">
                        <h3 className="text-xl font-semibold text-slate-300">Your Dream Journal is Empty</h3>
                        <p className="text-slate-400 mt-2">Press 'Record New Dream' to begin your journey.</p>
                    </div>
                )}
            </div>
        );
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
        <header className="text-center py-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center gap-3">
            <StarsIcon/> Dream Weaver AI
          </h1>
          <p className="text-slate-400 mt-2">{dreamState === DreamState.IDLE ? "Your personal oneironaut's log." : "Record your dream, unveil its meaning."}</p>
        </header>
        <div className="bg-slate-800/50 rounded-2xl shadow-2xl shadow-indigo-900/20 border border-slate-700 flex-grow flex flex-col min-h-[60vh]">
          {renderContent()}
        </div>
        <footer className="text-center py-4 text-xs text-slate-500">
            Powered by Gemini
        </footer>
      </div>
    </main>
  );
};

export default App;
