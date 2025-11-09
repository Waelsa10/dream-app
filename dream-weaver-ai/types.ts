export enum DreamState {
  IDLE,
  RECORDING,
  ANALYZING,
  COMPLETE,
  ERROR,
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Data returned from the analysis service
export interface DreamAnalysisResult {
  imageUrl: string;
  interpretation: string;
}

// Full dream object stored in the journal
export interface DreamData {
  id: string;
  transcript: string;
  imageUrl: string;
  interpretation: string;
  tags: string[];
  createdAt: number; // For sorting
}
