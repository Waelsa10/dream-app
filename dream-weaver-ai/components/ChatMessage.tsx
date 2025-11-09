import React from 'react';
import { type ChatMessage } from '../types';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageBubble: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-lg p-3 max-w-xs lg:max-w-md ${isUser ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
