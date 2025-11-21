import React from 'react';
import { Stage } from '../types';

interface StatusHUDProps {
  currentStage: Stage;
  wordCount: number;
  goalWordCount: number;
  xp: number;
}

export const StatusHUD: React.FC<StatusHUDProps> = ({ currentStage, wordCount, goalWordCount, xp }) => {
  const progress = Math.min(100, (wordCount / (goalWordCount || 1)) * 100);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 border border-quest-accent/50 rounded-full px-6 py-2 shadow-lg backdrop-blur flex items-center gap-8 text-sm font-mono">
      <div className="flex items-center gap-2">
        <span className="text-quest-warning">XP</span>
        <span className="text-white font-bold">{xp}</span>
      </div>
      
      <div className="flex items-center gap-3 w-64">
        <span className="text-quest-accent">Words</span>
        <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-quest-success transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-white">{wordCount}/{goalWordCount}</span>
      </div>

      <div className="hidden md:flex items-center gap-2 text-gray-400">
        <span>Level {currentStage + 1}/5</span>
      </div>
    </div>
  );
};