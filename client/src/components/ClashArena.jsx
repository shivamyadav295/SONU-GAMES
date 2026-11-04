import React from 'react';
import { Swords, Zap, CheckCircle2, Clock, Play, Square, Pause, RotateCcw } from 'lucide-react';
import MoveIllustration from './MoveIllustration';

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
  gameState = 'playing', // 'idle', 'playing', 'paused'
  onStartGame,
  onStopGame,
  onResumeGame,
  onResetGame,
  mode = 'pvc',
}) => {
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
  const player1Order = mode === 'pvc' ? 'order-3' : 'order-1';
  const player2Order = mode === 'pvc' ? 'order-1' : 'order-3';

  return (
    <div className="arena-glass-panel relative w-full rounded-3xl p-5 sm:p-8 overflow-hidden">

      {/* Top Arena Info Bar */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-[#1b253d]">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-arcade font-bold tracking-wide text-slate-700 uppercase">
            ROUND {roundNumber}
          </span>
          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
              gameState === 'playing'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : gameState === 'paused'
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : 'bg-amber-950/80 text-amber-300 border-amber-800'
            }`}
          >
            {gameState === 'playing' ? 'LIVE COMBAT' : gameState === 'paused' ? 'GAME STOPPED' : 'READY TO START'}
          </span>
        </div>

        {/* Center / Right Controls in Top Bar */}
        <div className="flex items-center space-x-2.5">
          {/* Active Timer Display */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span
              className={`font-arcade text-xs sm:text-sm font-bold tracking-wider ${
                gameState !== 'playing'
                  ? 'text-slate-400'
                  : timeLeft <= 2
                  ? 'text-rose-400 animate-ping'
                  : timeLeft <= 4
                  ? 'text-amber-400'
                  : 'text-slate-200'
              }`}
            >
              {timeLeft}s
            </span>
          </div>

          {/* Quick Start / Stop button inside the Arena Header */}
          {mode === 'pvc' && (
            <>
              {gameState === 'idle' && onStartGame && (
                <button
                  onClick={onStartGame}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-arcade font-bold text-xs tracking-wider flex items-center space-x-1 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>START</span>
                </button>
              )}

              {gameState === 'playing' && onStopGame && (
                <button
                  onClick={onStopGame}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-arcade font-bold text-xs tracking-wider flex items-center space-x-1 shadow-md shadow-rose-600/30 transition-all active:scale-95"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>STOP</span>
                </button>
              )}

              {gameState === 'paused' && onResumeGame && (
                <button
                  onClick={onResumeGame}
                  className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-arcade font-bold text-xs tracking-wider flex items-center space-x-1 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>RESUME</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Keep PvP players in score order; show the bot opposite the guest in PvC. */}
      <div className="relative grid grid-cols-3 items-center min-h-[220px] sm:min-h-[260px]">
        
        <div className={`flex flex-col items-center text-center ${player1Order}`}>
          {/* Avatar & Player Info */}
          <div className={`flex items-center space-x-2 mb-3 ${mode === 'pvc' ? 'flex-row-reverse' : ''}`}>
            <span className="text-2xl">{avatarIcons[player1?.avatar] || '🤖'}</span>
            <div className={mode === 'pvc' ? 'text-right' : 'text-left'}>
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
            className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 ease-out ${
              isClashing
                ? `${mode === 'pvc' ? 'animate-clash-right' : 'animate-clash-left'} bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-500/30`
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
              p1Move === 'timeout' ? (
                <span className="move-icon-3d move-icon-3d--arena" aria-hidden="true">⌛</span>
              ) : (
                <MoveIllustration move={p1Move} className="move-icon-3d move-icon-3d--arena" />
              )
            ) : p1Locked ? (
              <div className="flex flex-col items-center">
                <span className="text-4xl animate-gentle-pulse">🤜</span>
                <span className="text-[10px] font-arcade font-bold text-cyan-400 mt-1">LOCKED</span>
              </div>
            ) : gameState === 'idle' ? (
              <div className="flex flex-col items-center text-slate-500">
                <span className="text-2xl">⏳</span>
                <span className="text-[10px] font-tech text-slate-400 mt-1">WAITING START</span>
              </div>
            ) : gameState === 'paused' ? (
              <div className="flex flex-col items-center text-slate-500">
                <span className="text-2xl">⏸️</span>
                <span className="text-[10px] font-tech text-slate-400 mt-1">STOPPED</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <span className="text-3xl">❓</span>
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
              <span className="text-[11px] text-slate-500 font-tech">
                {gameState === 'idle' ? 'Ready to Start' : gameState === 'paused' ? 'Combat Halted' : 'Thinking...'}
              </span>
            )}
          </div>
        </div>

        {/* Center Stage: VS / Clash / Result Banner / Start-Stop states */}
        <div className="order-2 flex flex-col items-center justify-center">
          {gameState === 'idle' ? (
            <div className="flex flex-col items-center text-center animate-scaleIn">
              <button
                onClick={onStartGame}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-arcade font-bold text-xs sm:text-sm tracking-wider shadow-xl shadow-emerald-500/30 flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>START GAME</span>
              </button>
              <p className="text-[10px] text-slate-400 font-tech mt-2">
                Click Start to begin Round {roundNumber}
              </p>
            </div>
          ) : gameState === 'paused' ? (
            <div className="flex flex-col items-center text-center animate-scaleIn">
              <div className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-600 text-rose-300 font-arcade text-xs tracking-wider mb-2.5 shadow-lg shadow-rose-950/50">
                GAME STOPPED
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onResumeGame}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-arcade font-bold text-xs tracking-wider flex items-center space-x-1 shadow-md shadow-emerald-500/20"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>RESUME</span>
                </button>
                <button
                  onClick={onResetGame}
                  className="px-3 py-1.5 rounded-xl bg-[#18233a] hover:bg-[#233052] border border-[#2b3a60] text-slate-200 font-arcade text-xs tracking-wider flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET</span>
                </button>
              </div>
            </div>
          ) : roundResult ? (
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
            <div className="flex flex-col items-center animate-gentle-pulse">
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

        <div className={`flex flex-col items-center text-center ${player2Order}`}>
          {/* Avatar & Player Info */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">{avatarIcons[player2?.avatar] || (player2?.isBot ? '🤖' : '🥷')}</span>
            <div className={mode === 'pvc' ? 'text-left' : 'text-right'}>
              <span className="text-xs sm:text-sm font-bold text-pink-400 block truncate max-w-[110px] sm:max-w-[150px]">
                {player2?.username || 'Opponent'}
              </span>
              <span className="text-[10px] font-tech text-slate-400">
                Score: <strong className="text-white text-xs">{player2?.score || 0}</strong>
              </span>
            </div>
          </div>

          {/* Hand Box */}
          <div
            className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 ease-out ${
              isClashing
                ? `${mode === 'pvc' ? 'animate-clash-left' : 'animate-clash-right'} bg-pink-950/40 border-pink-400 shadow-xl shadow-pink-500/30`
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
              p2Move === 'timeout' ? (
                <span className="move-icon-3d move-icon-3d--arena" aria-hidden="true">⌛</span>
              ) : (
                <MoveIllustration move={p2Move} className="move-icon-3d move-icon-3d--arena" />
              )
            ) : p2Locked ? (
              <div className="flex flex-col items-center">
                <span className="text-4xl animate-gentle-pulse">🤛</span>
                <span className="text-[10px] font-arcade font-bold text-pink-400 mt-1">LOCKED</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <span className="text-3xl">❓</span>
                <span className="text-[10px] font-tech text-slate-400 mt-1">
                  {gameState === 'idle' ? 'STANDBY' : gameState === 'paused' ? 'STOPPED' : 'DECIDING'}
                </span>
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
              <span className="text-[11px] text-slate-500 font-tech">
                {gameState === 'idle' ? 'Standby' : gameState === 'paused' ? 'Halted' : 'Thinking...'}
              </span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ClashArena;
