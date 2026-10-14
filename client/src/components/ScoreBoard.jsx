import React from 'react';
import { Target, Award, Shield } from 'lucide-react';

export const ScoreBoard = ({
  player1,
  player2,
  targetWins = 2,
  roundsCount = 3,
  roundsHistory = [],
  mode = 'pvc',
}) => {
  const p1Score = player1?.score || 0;
  const p2Score = player2?.score || 0;

  return (
    <div className="w-full rounded-2xl bg-[#0e1424] border border-[#1f2b48] p-4 sm:p-5 shadow-lg">
      
      {/* Top Banner: Match Format & Target */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1b253c]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-arcade font-bold tracking-wider text-slate-300">
            {mode === 'pvc' ? 'PLAYER VS AI BOT' : 'MULTIPLAYER PVP DUEL'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-tech text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800/50">
          <Target className="w-3.5 h-3.5" />
          <span>First to {targetWins} Points (Best of {roundsCount})</span>
        </div>
      </div>

      {/* Score Progress Display */}
      <div className="grid grid-cols-2 gap-4 py-4 items-center">
        
        {/* P1 Score & Goal Dots */}
        <div className="flex flex-col items-center sm:items-start pl-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-arcade font-bold text-cyan-400">
              {p1Score}
            </span>
            <span className="text-xs text-slate-400 font-tech uppercase tracking-wider">
              {player1?.username || 'You'}
            </span>
          </div>

          {/* Dots indicating progress to target wins */}
          <div className="flex items-center space-x-1.5 mt-2">
            {Array.from({ length: targetWins }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  i < p1Score
                    ? 'bg-cyan-400 border-cyan-300 shadow-md shadow-cyan-500/50 scale-110'
                    : 'bg-[#151d32] border-[#2a385e]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* P2 Score & Goal Dots */}
        <div className="flex flex-col items-center sm:items-end pr-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-tech uppercase tracking-wider">
              {player2?.username || 'Opponent'}
            </span>
            <span className="text-2xl font-arcade font-bold text-pink-400">
              {p2Score}
            </span>
          </div>

          {/* Dots indicating progress to target wins */}
          <div className="flex items-center space-x-1.5 mt-2">
            {Array.from({ length: targetWins }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  i < p2Score
                    ? 'bg-pink-500 border-pink-400 shadow-md shadow-pink-500/50 scale-110'
                    : 'bg-[#151d32] border-[#2a385e]'
                }`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Round Breakdown History Row */}
      {roundsHistory.length > 0 && (
        <div className="pt-3 border-t border-[#1b253c]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span className="font-tech tracking-wider uppercase">Round Logs:</span>
            <span>{roundsHistory.length} round{roundsHistory.length > 1 ? 's' : ''} fought</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {roundsHistory.map((r, idx) => {
              const won = r.result === 'p1';
              const lost = r.result === 'p2';
              const draw = r.result === 'draw';

              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 ${
                    won
                      ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-300'
                      : lost
                      ? 'bg-rose-950/50 border-rose-600/60 text-rose-300'
                      : 'bg-amber-950/50 border-amber-600/60 text-amber-300'
                  }`}
                >
                  <span className="font-arcade text-[10px]">R{r.roundNumber || idx + 1}:</span>
                  <span>{won ? 'WIN' : lost ? 'LOSS' : 'TIE'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default ScoreBoard;
