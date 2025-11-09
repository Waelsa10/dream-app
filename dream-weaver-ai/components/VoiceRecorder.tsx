import React from 'react';
import { MicrophoneIcon, StopIcon } from './Icons';

interface VoiceRecorderProps {
  isRecording: boolean;
  startRecording?: () => void;
  stopRecording?: () => void;
  transcript?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ isRecording, startRecording, stopRecording, transcript }) => {
  if (isRecording) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-2xl font-bold text-indigo-300 animate-pulse mb-4">Recording...</h2>
        <p className="text-slate-400 mb-8 max-w-prose h-24 overflow-y-auto">{transcript || "Speak now, your dream is being heard..."}</p>
        <button
          onClick={stopRecording}
          className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-900/50 hover:bg-red-500 transition-all transform hover:scale-105"
          aria-label="Stop recording"
        >
          <StopIcon className="w-10 h-10" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">Ready to Uncover Your Dream?</h2>
      <p className="text-slate-400 mb-8 max-w-prose">Press the button and describe your dream as vividly as you can. When you're finished, press stop.</p>
      <button
        onClick={startRecording}
        className="w-28 h-28 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-900/50 hover:from-indigo-500 hover:to-purple-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
        aria-label="Start recording your dream"
      >
        <MicrophoneIcon className="w-12 h-12" />
      </button>
    </div>
  );
};

export default VoiceRecorder;
