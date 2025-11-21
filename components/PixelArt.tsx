import React from 'react';

// Common props for the scenes
interface ArtProps {
  className?: string;
}

export const HeroAvatar = ({ stage, className = "w-32 h-32" }: { stage: number, className?: string }) => {
  // Colors for armor progression
  const armorColors = ['#9ca3af', '#34d399', '#818cf8', '#fbbf24', '#22d3ee', '#ffffff'];
  const mainColor = armorColors[Math.min(stage, 5)] || armorColors[0];

  return (
    <svg viewBox="0 0 24 24" className={`${className} drop-shadow-xl animate-bounce-slow overflow-visible`} shapeRendering="crispEdges">
      <defs>
        <filter id="pixelate" x="0" y="0">
          <feFlood x="2" y="2" height="2" width="2"/>
          <feComposite width="4" height="4"/>
        </filter>
      </defs>
      
      {/* Aura for high level */}
      {stage >= 4 && (
        <circle cx="12" cy="12" r="12" fill={mainColor} opacity="0.2" className="animate-pulse" />
      )}

      {/* Body */}
      <rect x="10" y="10" width="4" height="6" fill={mainColor} />
      
      {/* Head */}
      <rect x="10" y="6" width="4" height="4" fill="#fca5a5" />
      {/* Helmet (Stage 1+) */}
      {stage > 0 && <path d="M10 6 h4 v1 h-4 z M9 7 h1 v3 h-1 z M14 7 h1 v3 h-1 z" fill="#4b5563" />}
      {/* Crown/Plume (Stage 4+) */}
      {stage >= 4 && <rect x="11" y="4" width="2" height="2" fill="#fbbf24" />}

      {/* Legs */}
      <rect x="10" y="16" width="1" height="4" fill="#1f2937" />
      <rect x="13" y="16" width="1" height="4" fill="#1f2937" />

      {/* Arms */}
      <rect x="9" y="10" width="1" height="4" fill="#fca5a5" />
      <rect x="14" y="10" width="1" height="4" fill="#fca5a5" />

      {/* Item: Scroll (Stage 0-1) */}
      {stage < 2 && <rect x="15" y="12" width="2" height="2" fill="#fef3c7" />}

      {/* Item: Shield (Stage 2+) */}
      {stage >= 2 && (
        <path d="M8 11 h-2 v3 l1 1 l1 -1 z" fill="#9ca3af" />
      )}

      {/* Item: Sword (Stage 3+) */}
      {stage >= 3 && (
        <g transform="translate(15, 9)">
          <rect x="1" y="0" width="1" height="4" fill="#e2e8f0" />
          <rect x="0" y="4" width="3" height="1" fill="#475569" />
          <rect x="1" y="5" width="1" height="1" fill="#78350f" />
        </g>
      )}
    </svg>
  );
};

export const TavernScene = ({ className }: ArtProps) => (
  <svg viewBox="0 0 100 60" className={className} shapeRendering="crispEdges">
    {/* Table */}
    <rect x="10" y="40" width="80" height="5" fill="#78350f" />
    <rect x="20" y="45" width="5" height="15" fill="#451a03" />
    <rect x="75" y="45" width="5" height="15" fill="#451a03" />
    {/* Candle */}
    <rect x="25" y="30" width="4" height="10" fill="#fef3c7" />
    <circle cx="27" cy="28" r="2" fill="#fbbf24" className="animate-pulse" />
    {/* Mug */}
    <rect x="60" y="32" width="8" height="8" fill="#92400e" />
    <rect x="68" y="34" width="3" height="4" fill="none" stroke="#92400e" strokeWidth="1" />
  </svg>
);

export const WoodsScene = ({ className }: ArtProps) => (
  <svg viewBox="0 0 100 60" className={className} shapeRendering="crispEdges">
    {/* Trees */}
    <path d="M20 40 L10 60 H30 Z" fill="#065f46" />
    <path d="M20 30 L10 50 H30 Z" fill="#10b981" />
    
    <path d="M80 35 L70 60 H90 Z" fill="#065f46" />
    <path d="M80 20 L65 45 H95 Z" fill="#10b981" />
    
    {/* Wisp */}
    <circle cx="50" cy="30" r="3" fill="#6ee7b7" className="animate-pulse">
      <animate attributeName="cy" values="30;25;30" dur="3s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export const FortressScene = ({ className }: ArtProps) => (
  <svg viewBox="0 0 100 60" className={className} shapeRendering="crispEdges">
    {/* Tower */}
    <rect x="60" y="10" width="30" height="50" fill="#374151" />
    <rect x="58" y="8" width="34" height="4" fill="#1f2937" />
    {/* Battlements */}
    <rect x="60" y="4" width="5" height="4" fill="#374151" />
    <rect x="72" y="4" width="5" height="4" fill="#374151" />
    <rect x="85" y="4" width="5" height="4" fill="#374151" />
    {/* Window */}
    <rect x="70" y="25" width="10" height="15" fill="#111827" />
    {/* Flag */}
    <path d="M60 10 L60 -10 L80 -5 L60 0" fill="#4f46e5" />
    <rect x="60" y="-10" width="1" height="20" fill="#9ca3af" />
  </svg>
);

export const PlainsScene = ({ className }: ArtProps) => (
  <svg viewBox="0 0 100 60" className={className} shapeRendering="crispEdges">
    {/* Tent */}
    <path d="M20 50 L40 20 L60 50" fill="#b45309" />
    <path d="M35 50 L40 20 L45 50" fill="#78350f" />
    {/* Fire */}
    <path d="M70 50 L65 45 L75 45 Z" fill="#ef4444" className="animate-pulse" />
    <circle cx="70" cy="42" r="2" fill="#f59e0b" className="animate-bounce" />
    {/* Logs */}
    <rect x="62" y="50" width="16" height="3" fill="#451a03" />
  </svg>
);

export const DragonScene = ({ className }: ArtProps) => (
  <svg viewBox="0 0 120 80" className={className} shapeRendering="crispEdges">
    {/* Dragon Body */}
    <path d="M80 50 Q 60 40 40 50 T 10 60" stroke="#b91c1c" strokeWidth="10" fill="none" />
    {/* Head */}
    <rect x="75" y="25" width="20" height="15" fill="#b91c1c" />
    <rect x="95" y="30" width="10" height="5" fill="#b91c1c" />
    <rect x="85" y="28" width="2" height="2" fill="#fef08a" />
    {/* Smoke */}
    <circle cx="105" cy="32" r="2" fill="#9ca3af" opacity="0.5" className="animate-ping" />
    {/* Treasure Pile */}
    <path d="M0 80 L20 60 L40 80 Z" fill="#fbbf24" />
    <path d="M20 80 L40 65 L60 80 Z" fill="#f59e0b" />
  </svg>
);

export const VictoryScene = ({ className }: ArtProps) => (
  <svg viewBox="0 0 100 60" className={className} shapeRendering="crispEdges">
    {/* Chest Base */}
    <rect x="35" y="30" width="30" height="20" fill="#b45309" />
    <rect x="35" y="35" width="30" height="2" fill="#78350f" />
    {/* Chest Lid (Open) */}
    <path d="M35 30 L35 15 L65 15 L65 30" fill="#92400e" />
    <rect x="48" y="25" width="4" height="5" fill="#fbbf24" />
    
    {/* Gold/Light emitting */}
    <path d="M40 20 L30 10" stroke="#fcd34d" strokeWidth="2" className="animate-pulse" />
    <path d="M50 20 L50 5" stroke="#fcd34d" strokeWidth="2" className="animate-pulse" />
    <path d="M60 20 L70 10" stroke="#fcd34d" strokeWidth="2" className="animate-pulse" />
    
    {/* Confetti */}
    <rect x="20" y="10" width="2" height="2" fill="#f472b6" className="animate-bounce" />
    <rect x="80" y="15" width="2" height="2" fill="#60a5fa" className="animate-bounce" />
    <rect x="50" y="5" width="2" height="2" fill="#a3e635" className="animate-bounce" />
  </svg>
);