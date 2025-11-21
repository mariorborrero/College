import React from 'react';

interface LevelLayoutProps {
  title: string;
  subtitle: string;
  colorClass: string; // Tailwind bg color class suffix
  children: React.ReactNode;
  isActive: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  canProceed?: boolean;
  nextLabel?: string;
  visual?: React.ReactNode; // Now rendered in the header
}

export const LevelLayout: React.FC<LevelLayoutProps> = ({
  title,
  subtitle,
  colorClass,
  children,
  isActive,
  onNext,
  onPrev,
  canProceed = true,
  nextLabel = "Travel East",
  visual
}) => {
  return (
    <div 
      className={`
        w-screen h-screen flex-shrink-0 flex flex-col relative overflow-hidden
        transition-opacity duration-500
        ${isActive ? 'opacity-100' : 'opacity-30 blur-sm pointer-events-none'}
        bg-gradient-to-b from-gray-900 to-${colorClass}
      `}
    >
      {/* Header / HUD */}
      <div className="h-28 flex items-center justify-between px-4 md:px-8 border-b border-white/10 bg-black/40 backdrop-blur-sm z-30 relative shrink-0">
        {/* Left: Title Info */}
        <div className="w-1/3 hidden md:block">
          <h1 className="text-2xl md:text-3xl pixel-font text-white tracking-wider text-shadow-sm">{title}</h1>
          <p className="text-white/60 text-xs md:text-sm font-medium uppercase tracking-widest">{subtitle}</p>
        </div>
        
        {/* Center: The Character/Scene (Side Scroller View) */}
        <div className="flex-1 md:w-1/3 flex justify-center items-end h-full pb-2 overflow-visible">
          {visual}
        </div>

        {/* Right: Navigation */}
        <div className="w-1/3 flex justify-end gap-2 md:gap-4">
          {onPrev && (
            <button 
              onClick={onPrev}
              className="px-3 md:px-6 py-2 rounded border border-white/20 hover:bg-white/10 text-white pixel-font text-lg md:text-xl transition-all"
            >
              ← Back
            </button>
          )}
          {onNext && (
            <button 
              onClick={onNext}
              disabled={!canProceed}
              className={`
                px-3 md:px-6 py-2 rounded pixel-font text-lg md:text-xl flex items-center gap-2 transition-all
                ${canProceed 
                  ? 'bg-quest-success text-black hover:scale-105 hover:shadow-[0_0_15px_rgba(158,206,106,0.5)]' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
              `}
            >
              <span className="hidden md:inline">{nextLabel}</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scroll relative p-4 md:p-8 max-w-7xl mx-auto w-full z-10">
        {/* Mobile Title (shown inside content on small screens) */}
        <div className="md:hidden mb-4 text-center">
           <h1 className="text-2xl pixel-font text-white">{title}</h1>
        </div>
        
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-2xl h-full flex flex-col relative overflow-hidden">
          {children}
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none -z-10" />
    </div>
  );
};
