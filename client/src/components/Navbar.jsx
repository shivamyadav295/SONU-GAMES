import React, { useState } from 'react';
import { Trophy, History, Volume2, VolumeX, LogIn, LogOut, Flame } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 transition-colors group-hover:bg-emerald-50">
            <div className="w-full h-full rounded-[10px] flex items-center justify-center">
              <span className="text-xl" aria-hidden="true">✊</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-arcade text-lg sm:text-xl font-bold tracking-tight text-slate-800">
                CLASH RPS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 tracking-wide hidden sm:block">
              ROCK · PAPER · SCISSORS
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
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
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
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 text-amber-700 text-xs sm:text-sm font-medium transition-all duration-200"
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
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 text-slate-600 hover:text-emerald-800 text-xs sm:text-sm font-medium transition-all duration-200"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* User Profile Badge & Auth Actions */}
          {user ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-slate-200">
              {/* Profile Chip */}
              <div
                onClick={onOpenAuth}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all"
                title={`Profile: ${user.username} (${user.isGuest ? 'Guest Mode' : 'Registered User'})`}
              >
                <span className="text-base sm:text-lg">
                  {avatarIcons[user.avatar] || '🤖'}
                </span>
                <div className="text-left hidden md:block">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[100px]">
                      {user.username}
                    </span>
                    {user.isGuest && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
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
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs whitespace-nowrap transition-colors"
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
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-700 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs whitespace-nowrap font-semibold transition-colors"
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
