import React, { useState } from 'react';
import { Trophy, History, Volume2, VolumeX, User, LogIn, LogOut, Flame, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import soundManager from '../services/sound';

export const Navbar = ({ onOpenLeaderboard, onOpenHistory, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const [muted, setMuted] = useState(soundManager.isMuted());

  const handleToggleSound = () => {
    const isNowMuted = soundManager.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      soundManager.playSelect();
    }
  };

  const avatarIcons = {
    robot: '🤖',
    ninja: '🥷',
    wizard: '🧙',
    cyberpunk: '⚡',
    skull: '💀',
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1f2b48] bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#0d1322] rounded-[10px] flex items-center justify-center">
              <span className="text-xl">⚔️</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-arcade text-lg sm:text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-pink-400">
                CLASH RPS
              </span>
              <span className="text-[10px] font-arcade px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider font-tech hidden sm:block">
              CYBERPUNK ROCK PAPER SCISSORS
            </p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
            className={`p-2 rounded-lg border transition-all ${
              muted
                ? 'bg-red-950/40 border-red-800/50 text-red-400 hover:bg-red-900/50'
                : 'bg-cyan-950/40 border-cyan-800/50 text-cyan-400 hover:bg-cyan-900/50 shadow-sm shadow-cyan-500/20'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => {
              soundManager.playSelect();
              onOpenLeaderboard();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#233052] bg-[#111726]/80 hover:bg-[#161f36] hover:border-amber-500/50 text-amber-400 text-xs sm:text-sm font-medium transition-all duration-200"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          {/* Match History Button */}
          <button
            onClick={() => {
              soundManager.playSelect();
              onOpenHistory();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#233052] bg-[#111726]/80 hover:bg-[#161f36] hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 text-xs sm:text-sm font-medium transition-all duration-200"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* User Profile Badge & Auth Actions */}
          {user ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-[#1f2b48]">
              {/* Profile Chip */}
              <div
                onClick={onOpenAuth}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#141b2e] border border-[#233052] hover:border-cyan-500/40 cursor-pointer transition-all"
                title={`Profile: ${user.username} (${user.isGuest ? 'Guest Mode' : 'Registered User'})`}
              >
                <span className="text-base sm:text-lg">
                  {avatarIcons[user.avatar] || '🤖'}
                </span>
                <div className="text-left hidden md:block">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                      {user.username}
                    </span>
                    {user.isGuest && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                        Guest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-medium">{user.stats?.wins || 0}W</span>
                    <span>-</span>
                    <span className="text-rose-400 font-medium">{user.stats?.losses || 0}L</span>
                    {user.stats?.currentStreak > 1 && (
                      <span className="flex items-center text-amber-400 pl-1">
                        <Flame className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
                        {user.stats.currentStreak}x
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Login / Register or Logout Button */}
              {user.isGuest ? (
                <button
                  onClick={() => {
                    soundManager.playSelect();
                    onOpenAuth();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition-all shadow-md shadow-cyan-500/20"
                >
                  <span className="flex items-center space-x-1">
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign In</span>
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    soundManager.playSelect();
                    logout();
                  }}
                  title="Log Out"
                  className="p-1.5 rounded-lg border border-[#233052] bg-[#111726] hover:bg-rose-950/40 hover:border-rose-800/50 text-slate-400 hover:text-rose-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
