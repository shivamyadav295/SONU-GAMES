import React, { useState } from 'react';
import { Copy, Check, Users, PlusCircle, ArrowRight, Loader2, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import soundManager from '../services/sound';

export const RoomLobby = ({
  room,
  isInRoom,
  isWaitingForOpponent,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onSendReaction,
  activeReaction,
}) => {
  const [tab, setTab] = useState('create'); // 'create' or 'join'
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [targetRounds, setTargetRounds] = useState(3);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCopyCode = () => {
    if (!room?.roomCode) return;
    soundManager.playSelect();
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    soundManager.playSelect();
    setErrorMessage('');
    onJoinRoom(inputCode.trim().toUpperCase());
  };

  const reactionEmojis = ['🔥', '🎯', '💥', '⚡', '🤖', '👏', '💀', '😱'];

  // 1. If currently in room waiting for opponent
  if (isInRoom && isWaitingForOpponent) {
    return (
      <div className="w-full rounded-3xl bg-[#0d1322] border border-[#233052] p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/50 text-cyan-400 mb-4 animate-glow-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>

          <h3 className="text-xl font-arcade font-bold text-white tracking-wide">
            MULTIPLAYER ARENA READY
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Share this room code with a friend to duel in real-time
          </p>

          {/* Glowing Room Code Display */}
          <div className="p-4 rounded-2xl bg-[#080b12] border-2 border-cyan-500/60 shadow-lg shadow-cyan-500/20 mb-6 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase font-tech tracking-wider text-slate-400 block">
                ROOM CODE (BEST OF {room?.roundsCount || 3})
              </span>
              <span className="text-2xl sm:text-3xl font-arcade font-black tracking-widest text-cyan-400">
                {room?.roomCode}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-md shadow-cyan-500/30"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Leave Button */}
          <button
            onClick={() => {
              soundManager.playSelect();
              onLeaveRoom();
            }}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors py-1"
          >
            Cancel and Leave Room
          </button>
        </div>
      </div>
    );
  }

  // 2. If in active match, show live reaction emojis bar
  if (isInRoom && !isWaitingForOpponent) {
    return (
      <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0e1424] border border-[#1f2b48]">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-tech tracking-wider uppercase text-slate-400">
            Room: <strong className="text-cyan-400 font-arcade">{room?.roomCode}</strong>
          </span>
        </div>

        {/* Floating Quick Reaction Emojis */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-slate-500 font-tech mr-1 hidden sm:inline">
            Emotes:
          </span>
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                soundManager.playSelect();
                onSendReaction(emoji);
              }}
              className="w-8 h-8 rounded-lg bg-[#141b2e] border border-[#233052] hover:border-pink-500 hover:scale-125 transition-all text-base flex items-center justify-center active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            soundManager.playSelect();
            onLeaveRoom();
          }}
          className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-950/40 border border-rose-800/40 transition-colors"
        >
          Forfeit / Exit
        </button>
      </div>
    );
  }

  // 3. Not in room: Create Room or Join Room forms
  return (
    <div className="w-full rounded-3xl bg-[#0d1322] border border-[#1f2b48] p-6 sm:p-8 shadow-2xl">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 mb-3 shadow-lg shadow-pink-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-arcade font-bold text-white tracking-wide">
            REAL-TIME MULTIPLAYER
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Challenge players across devices with synchronized room duels
          </p>
        </div>

        {/* Tab switch: Create vs Join */}
        <div className="grid grid-cols-2 p-1 bg-[#080b12] rounded-xl border border-[#1f2b48] mb-6">
          <button
            onClick={() => {
              soundManager.playSelect();
              setTab('create');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'create'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create New Room
          </button>
          <button
            onClick={() => {
              soundManager.playSelect();
              setTab('join');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'join'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Join with Code
          </button>
        </div>

        {/* Tab Content: Create Room */}
        {tab === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Select Game Length:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rounds: 1, target: 1, label: 'Best of 1' },
                  { rounds: 3, target: 2, label: 'Best of 3' },
                  { rounds: 5, target: 3, label: 'Best of 5' },
                ].map((fmt) => (
                  <button
                    key={fmt.rounds}
                    type="button"
                    onClick={() => {
                      soundManager.playSelect();
                      setTargetRounds(fmt.rounds);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                      targetRounds === fmt.rounds
                        ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                        : 'bg-[#131a2d] border-[#233052] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playSelect();
                const targetWins = Math.ceil(targetRounds / 2);
                onCreateRoom(targetWins, targetRounds);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate Room Code</span>
            </button>
          </div>
        )}

        {/* Tab Content: Join Room */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Enter 6-Character Room Code:
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7K2M9X"
                className="w-full px-4 py-3 rounded-xl bg-[#080b12] border border-[#233052] font-arcade text-center text-lg tracking-widest text-pink-400 placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 uppercase transition-all"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-sm tracking-wider shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>Connect to Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default RoomLobby;
