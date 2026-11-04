import React from 'react';
import { Bot, Users } from 'lucide-react';
import soundManager from '../services/sound';

export const ModeSelector = ({
  mode,
  setMode,
  roundsCount,
  setRoundsCount,
  disabled = false,
}) => {
  const matchFormats = [
    { label: 'Best of 1', rounds: 1, targetWins: 1, tag: '⚡ Quick' },
    { label: 'Best of 3', rounds: 3, targetWins: 2, tag: '🔥 Standard' },
    { label: 'Best of 5', rounds: 5, targetWins: 3, tag: '👑 Championship' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-sm">
      
      {/* Mode Buttons: PvC vs PvP */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (mode !== 'pvc') {
              soundManager.playSelect();
              setMode('pvc');
            }
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-arcade font-bold tracking-wider transition-all duration-200 ${
            mode === 'pvc'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>VS BOT (PvC)</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (mode !== 'pvp') {
              soundManager.playSelect();
              setMode('pvp');
            }
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-arcade font-bold tracking-wider transition-all duration-200 ${
            mode === 'pvp'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>MULTIPLAYER (PvP)</span>
        </button>
      </div>

      {/* Game Length Selector: Best of 1, 3, 5 */}
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
        <span className="text-[11px] text-slate-400 font-tech uppercase tracking-wider hidden lg:inline">
          Series Length:
        </span>
        <div className="flex items-center space-x-1.5">
          {matchFormats.map((fmt) => (
            <button
              key={fmt.rounds}
              type="button"
              disabled={disabled}
              onClick={() => {
                soundManager.playSelect();
                setRoundsCount(fmt.rounds);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                roundsCount === fmt.rounds
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>{fmt.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ModeSelector;
