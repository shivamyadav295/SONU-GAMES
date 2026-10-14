import React from 'react';
import { Swords, Zap, CheckCircle2, Clock } from 'lucide-react';

export const ClashArena = ({
  player1,
  player2,
  p1Move,
  p2Move,
  p1Locked,
  p2Locked,
  roundResult, // null, 'p1', 'p2', 'draw'
  isClashing,
  timeLeft,
  maxTime = 5,
  roundNumber = 1,
}) => {
  const moveIcons = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️',
    timeout: '⌛',
  };

  const moveLabels = {
    rock: 'ROCK',
    paper: 'PAPER',
    scissors: 'SCISSORS',
    timeout: 'TIMEOUT',
  };

  const avatarIcons = {
    robot: '🤖',
    ninja: '🥷',
    wizard: '🧙',
    cyberpunk: '⚡',
    skull: '💀',
  };

  // Explanation strings for moves
  const getMoveExplanation = (m1, m2, res) => {
    if (!m1 || !m2) return '';
    if (res === 'draw') return "Identical moves! It's a standoff.";
    if (m1 === 'timeout' && m2 === 'timeout') return 'Both players ran out of time!';
    if (m1 === 'timeout') return 'Player 1 timed out!';
    if (m2 === 'timeout') return 'Opponent timed out!';

    if ((m1 === 'rock' && m2 === 'scissors') || (m2 === 'rock' && m1 === 'scissors')) {
      return 'Rock smashes Scissors into dust!';
    }
    if ((m1 === 'scissors' && m2 === 'paper') || (m2 === 'scissors' && m1 === 'paper')) {
      return 'Scissors effortlessly shreds Paper!';
    }
    if ((m1 === 'paper' && m2 === 'rock') || (m2 === 'paper' && m1 === 'rock')) {
      return 'Paper suffocates and covers Rock!';
    }
    return '';
  };

  // Timer circle calculation
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  const strokeDashoffset = 100 - progressPercent;

  return (
    <div className="relative w-full rounded-3xl bg-[#0b0f1a] border border-[#1f2b48] p-6 sm:p-8 overflow-hidden shadow-2xl">
      
      {/* Background Arena FX */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-24 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Arena Info Bar */}
      <div className="relative flex items-center justify-between pb-4 mb-6 border-b border-[#1b253d]">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-arcade font-bold tracking-widest text-cyan-400 uppercase">
            ROUND {roundNumber}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#162035] text-slate-300 border border-[#233052]">
            LIVE COMBAT
          </span>
        </div>

        {/* Center Countdown Timer */}
        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={`font-arcade text-sm font-bold tracking-wider ${
              timeLeft <= 2 ? 'text-rose-400 animate-ping' : timeLeft <= 4 ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Main Duel Stage: P1 Hand vs Center VS vs P2 Hand */}
      <div className="relative grid grid-cols-3 items-center min-h-[220px] sm:min-h-[260px]">
        
        {/* Left Side: Player 1 */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar & Player Info */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">{avatarIcons[player1?.avatar] || '🤖'}</span>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-bold text-cyan-400 block truncate max-w-[110px] sm:max-w-[150px]">
                {player1?.username || 'You'}
              </span>
              <span className="text-[10px] font-tech text-slate-400">
                Score: <strong className="text-white text-xs">{player1?.score || 0}</strong>
              </span>
            </div>
          </div>

          {/* Hand Box */}
          <div
            className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 ${
              isClashing
                ? 'animate-clash-left bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-500/30'
                : roundResult === 'p1'
                ? 'border-emerald-400 bg-emerald-950/40 shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400'
                : roundResult === 'p2'
                ? 'border-rose-900 bg-rose-950/20 opacity-70'
                : p1Locked
                ? 'border-cyan-500/60 bg-cyan-950/30 ring-1 ring-cyan-400/40'
                : 'border-[#233052] bg-[#121829]'
            }`}
          >
            {p1Move ? (
              <span className="text-5xl sm:text-6xl drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                {moveIcons[p1Move] || '❓'}
              </span>
            ) : p1Locked ? (
              <div className="flex flex-col items-center">
                <span className="text-4xl animate-pulse">🤜</span>
                <span className="text-[10px] font-arcade font-bold text-cyan-400 mt-1">LOCKED</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <span className="text-3xl animate-bounce-short">❓</span>
                <span className="text-[10px] font-tech text-slate-400 mt-1">CHOOSE MOVE</span>
              </div>
            )}

            {p1Move && (
              <span className="absolute -bottom-2.5 px-2 py-0.5 rounded text-[10px] font-arcade font-bold bg-[#0a0e1a] border border-[#233052] text-cyan-300">
                {moveLabels[p1Move] || ''}
              </span>
            )}
          </div>

          {/* Locked status pill */}
          <div className="mt-4">
            {p1Locked ? (
              <span className="inline-flex items-center text-[11px] font-medium text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Move Locked
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-tech">Thinking...</span>
            )}
          </div>
        </div>

        {/* Center Stage: VS / Clash / Result Banner */}
        <div className="flex flex-col items-center justify-center">
          {roundResult ? (
            <div className="flex flex-col items-center text-center animate-scaleIn">
              <div
                className={`px-3 sm:px-4 py-1.5 rounded-full font-arcade font-bold text-xs sm:text-sm tracking-wider uppercase border shadow-lg ${
                  roundResult === 'p1'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-emerald-500/30'
                    : roundResult === 'p2'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-rose-500/30'
                    : 'bg-amber-950 border-amber-500 text-amber-300 shadow-amber-500/30'
                }`}
              >
                {roundResult === 'p1' ? 'ROUND WON!' : roundResult === 'p2' ? 'ROUND LOST' : 'DRAW TIE!'}
              </div>
              <p className="text-[11px] text-slate-300 mt-2 font-tech max-w-[180px] leading-tight">
                {getMoveExplanation(p1Move, p2Move, roundResult)}
              </p>
            </div>
          ) : isClashing ? (
            <div className="flex flex-col items-center animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/40">
                <Zap className="w-6 h-6 text-black fill-black" />
              </div>
              <span className="text-[10px] font-arcade font-bold text-white mt-1.5 tracking-widest">
                CLASHING!
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                {/* SVG Circular Timer Ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    className="stroke-[#192338]"
                    strokeWidth="3"
                    fill="transparent"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    className="stroke-cyan-400 transition-all duration-1000 ease-linear"
                    strokeWidth="3.5"
                    strokeDasharray="251"
                    strokeDashoffset={`${(strokeDashoffset / 100) * 251}`}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-arcade text-base sm:text-lg font-bold text-white">
                    {timeLeft}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-arcade font-bold text-slate-500 tracking-wider mt-1">
                VS
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Opponent (Bot or Player 2) */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar & Player Info */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="text-right">
              <span className="text-xs sm:text-sm font-bold text-pink-400 block truncate max-w-[110px] sm:max-w-[150px]">
                {player2?.username || 'Opponent'}
              </span>
              <span className="text-[10px] font-tech text-slate-400">
                Score: <strong className="text-white text-xs">{player2?.score || 0}</strong>
              </span>
            </div>
            <span className="text-2xl">{avatarIcons[player2?.avatar] || (player2?.isBot ? '🤖' : '🥷')}</span>
          </div>

          {/* Hand Box */}
          <div
            className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 ${
              isClashing
                ? 'animate-clash-right bg-pink-950/40 border-pink-400 shadow-xl shadow-pink-500/30'
                : roundResult === 'p2'
                ? 'border-emerald-400 bg-emerald-950/40 shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400'
                : roundResult === 'p1'
                ? 'border-rose-900 bg-rose-950/20 opacity-70'
                : p2Locked
                ? 'border-pink-500/60 bg-pink-950/30 ring-1 ring-pink-400/40'
                : 'border-[#233052] bg-[#121829]'
            }`}
          >
            {p2Move ? (
              <span className="text-5xl sm:text-6xl drop-shadow-[0_0_15px_rgba(255,0,127,0.4)]">
                {moveIcons[p2Move] || '❓'}
              </span>
            ) : p2Locked ? (
              <div className="flex flex-col items-center">
                <span className="text-4xl animate-pulse">🤛</span>
                <span className="text-[10px] font-arcade font-bold text-pink-400 mt-1">LOCKED</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <span className="text-3xl animate-bounce-short">❓</span>
                <span className="text-[10px] font-tech text-slate-400 mt-1">DECIDING</span>
              </div>
            )}

            {p2Move && (
              <span className="absolute -bottom-2.5 px-2 py-0.5 rounded text-[10px] font-arcade font-bold bg-[#0a0e1a] border border-[#233052] text-pink-300">
                {moveLabels[p2Move] || ''}
              </span>
            )}
          </div>

          {/* Locked status pill */}
          <div className="mt-4">
            {p2Locked ? (
              <span className="inline-flex items-center text-[11px] font-medium text-pink-400 bg-pink-950/60 px-2.5 py-0.5 rounded-full border border-pink-800">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Move Locked
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-tech">Thinking...</span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ClashArena;
