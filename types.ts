
export enum Stage {
  SETUP = 0,
  BRAINSTORM = 1,
  OUTLINE = 2,
  DRAFT = 3,
  REFINE = 4,
  CREDITS = 5
}

export interface EssayGoals {
  wordCount: number;
  paragraphCount: number;
  topic: string;
  audience: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface OutlineItem {
  id: string;
  title: string;
  description: string;
}

export interface FeedbackPoint {
  type: 'strength' | 'improvement' | 'suggestion';
  text: string;
  area: string;
}

export interface AppState {
  currentStage: Stage;
  goals: EssayGoals;
  brainstormChat: ChatMessage[];
  suggestedIdeas: string[]; // Extracted from brainstorm
  outline: OutlineItem[];
  draftContent: string;
  refinementFeedback: FeedbackPoint[];
  xp: number; // Gamification element
  revisionCount: number;
}

export const INITIAL_STATE: AppState = {
  currentStage: Stage.SETUP,
  goals: {
    wordCount: 500,
    paragraphCount: 5,
    topic: '',
    audience: 'General Academic',
  },
  brainstormChat: [],
  suggestedIdeas: [],
  outline: [],
  draftContent: '',
  refinementFeedback: [],
  xp: 0,
  revisionCount: 0,
};