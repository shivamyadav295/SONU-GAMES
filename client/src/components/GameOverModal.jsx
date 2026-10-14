import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, ArrowLeft, Flame, Award, Skull } from 'lucide-react';
import soundManager from '../services/sound';

export const GameOverModal = ({
  isOpen,
  winner, // { id, username, avatar } or null
  isMyWin,
  scores, // { p1: Number, p2: Number }
  player1,
  player2,
  roundsHistory = [],
  mode = 'pvc',
  onPlayAgain,
  onExitLobby,
  rematchWaiting = false,
  rematchStatus = null, // { p1Ready: Boolean, p2Ready: Boolean }
  forfeitMessage = null, // alert message when player exits browser
}) => {
  useEffect(() => {
    if (isOpen) {
      if (isMyWin) {
        soundManager.playMatchVictory();
        // Trigger celebration confetti
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00f0ff', '#ff007f', '#ffaa00', '#00ff88', '#ffffff'],
          });
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
            });
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
            });
          }, 350);
        } catch (e) {}
      } else {
        soundManager.playLose();
      }
    }
  }, [isOpen, isMyWin]);

  if (!isOpen) return null;

  const moveEmoji = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️',
    timeout: '⌛',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0e1424] border-2 border-cyan-500/50 p-6 sm:p-8 shadow-2xl shadow-cyan-500/20 text-center">
        
        {/* Victory / Defeat Trophy Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 relative">
          <div
            className={`w-full h-full rounded-3xl flex items-center justify-center shadow-2xl ${
              isMyWin
                ? 'bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-300 shadow-amber-500/40 animate-glow-pulse'
                : 'bg-gradient-to-tr from-rose-600 to-slate-800 shadow-rose-500/30'
            }`}
          >
            {isMyWin ? (
              <Trophy className="w-10 h-10 text-black fill-black" />
            ) : (
              <Skull className="w-10 h-10 text-white" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          className={`text-2xl sm:text-3xl font-arcade font-black tracking-wider uppercase ${
            isMyWin ? 'text-amber-400 text-glow-cyan' : 'text-rose-400'
          }`}
        >
          {forfeitMessage ? 'MATCH TERMINATED' : isMyWin ? 'MATCH VICTORY!' : 'MATCH DEFEAT'}
        </h2>

        {forfeitMessage && (
          <div className="mt-3 p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-2">
            <span>🚨</span>
            <span>{forfeitMessage}</span>
          </div>
        )}

        <p className="text-xs sm:text-sm text-slate-300 mt-2 font-tech tracking-wider">
          {forfeitMessage
            ? 'The game was stopped because the player disconnected or exited the browser window.'
            : isMyWin
            ? `Congratulations! You conquered ${player2?.username || 'the opponent'}.`
            : `${winner?.username || 'Opponent'} claimed the championship series.`}
        </p>

        {/* Final Series Score Card */}
        <div className="my-6 p-4 rounded-2xl bg-[#080b12] border border-[#1f2b48]">
          <div className="text-[11px] font-arcade text-slate-400 uppercase tracking-widest mb-2">
            FINAL SCOREBOARD
          </div>

          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <span className="text-xs font-semibold text-cyan-400 block truncate max-w-[120px]">
                {player1?.username || 'You'}
              </span>
              <span className="text-3xl font-arcade font-black text-cyan-400 mt-1 block">
                {scores?.p1 || 0}
              </span>
            </div>

            <span className="text-slate-600 font-arcade text-xl">:</span>

            <div className="text-center">
              <span className="text-xs font-semibold text-pink-400 block truncate max-w-[120px]">
                {player2?.username || 'Opponent'}
              </span>
              <span className="text-3xl font-arcade font-black text-pink-400 mt-1 block">
                {scores?.p2 || 0}
              </span>
            </div>
          </div>

          {/* Rounds Log Pills */}
          {roundsHistory && roundsHistory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#162035] flex items-center justify-center space-x-2 flex-wrap gap-y-1.5">
              {roundsHistory.map((r, i) => (
                <div
                  key={i}
                  className="px-2 py-0.5 rounded bg-[#111726] border border-[#1f2b48] text-xs flex items-center space-x-1"
                >
                  <span className="text-[10px] text-slate-500 font-tech">R{i + 1}:</span>
                  <span>{moveEmoji[r.p1Move] || '❓'}</span>
                  <span className="text-slate-600 text-[10px]">vs</span>
                  <span>{moveEmoji[r.p2Move] || '❓'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rematch status for PvP */}
        {mode === 'pvp' && rematchWaiting && (
          <div className="mb-4 text-xs font-tech text-amber-400 animate-pulse bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/50">
            Waiting for opponent to accept rematch...
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              soundManager.playSelect();
              onPlayAgain();
            }}
            disabled={rematchWaiting}
            className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-arcade font-bold text-xs tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{mode === 'pvp' ? 'REQUEST REMATCH' : 'PLAY AGAIN'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playSelect();
              onExitLobby();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#141b2e] hover:bg-[#1a233a] border border-[#233052] text-slate-300 font-arcade text-xs tracking-wider transition-all flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>EXIT</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default GameOverModal;
