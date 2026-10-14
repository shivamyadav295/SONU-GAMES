import React from 'react';
import soundManager from '../services/sound';

export const MoveCard = ({
  move,
  label,
  icon,
  keyNumber,
  selected,
  disabled,
  onClick,
  accentColor = 'cyan', // 'cyan', 'pink', 'amber'
}) => {
  const handleClick = () => {
    if (disabled) return;
    soundManager.playSelect();
    onClick(move);
  };

  const accentStyles = {
    cyan: {
      activeBorder: 'border-cyan-400 shadow-lg shadow-cyan-500/30 bg-cyan-950/30',
      activeText: 'text-cyan-400',
      badgeBg: 'bg-cyan-500 text-black',
      hoverBorder: 'hover:border-cyan-500/60 hover:shadow-md hover:shadow-cyan-500/20',
    },
    pink: {
      activeBorder: 'border-pink-500 shadow-lg shadow-pink-500/30 bg-pink-950/30',
      activeText: 'text-pink-400',
      badgeBg: 'bg-pink-500 text-white',
      hoverBorder: 'hover:border-pink-500/60 hover:shadow-md hover:shadow-pink-500/20',
    },
    amber: {
      activeBorder: 'border-amber-400 shadow-lg shadow-amber-500/30 bg-amber-950/30',
      activeText: 'text-amber-400',
      badgeBg: 'bg-amber-400 text-black',
      hoverBorder: 'hover:border-amber-500/60 hover:shadow-md hover:shadow-amber-500/20',
    },
  }[accentColor] || {};

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`group relative flex-1 flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border transition-all duration-300 select-none ${
        selected
          ? `${accentStyles.activeBorder} scale-[1.04] ring-2 ring-cyan-400/50`
          : disabled
          ? 'bg-[#0f1422]/50 border-[#1c2438] opacity-50 cursor-not-allowed'
          : `bg-[#111726]/80 border-[#233052] ${accentStyles.hoverBorder} hover:-translate-y-1 hover:bg-[#161f36]`
      }`}
    >
      {/* Keyboard Shortcut Chip */}
      <span
        className={`absolute top-2.5 right-2.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md transition-all ${
          selected
            ? accentStyles.badgeBg
            : 'bg-[#1c253d] text-slate-400 group-hover:text-slate-200'
        }`}
      >
        [{keyNumber}]
      </span>

      {/* Hand Gesture Icon */}
      <div
        className={`text-4xl sm:text-5xl transition-transform duration-300 ${
          selected ? 'scale-125 animate-bounce-short' : 'group-hover:scale-110'
        }`}
      >
        {icon}
      </div>

      {/* Label */}
      <span
        className={`mt-3 text-xs sm:text-sm font-arcade font-bold tracking-wider transition-colors ${
          selected ? accentStyles.activeText : 'text-slate-300 group-hover:text-white'
        }`}
      >
        {label}
      </span>

      {/* Subtle Bottom Accent Indicator */}
      {selected && (
        <div className="absolute bottom-1 w-8 h-1 rounded-full bg-cyan-400 animate-pulse" />
      )}
    </button>
  );
};

export default MoveCard;
