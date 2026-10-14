import React, { useEffect, useState } from 'react';
import { Trophy, X, RefreshCw, Flame, Medal, Award, Crown } from 'lucide-react';
import { matchApi } from '../services/api';
import soundManager from '../services/sound';

export const LeaderboardModal = ({ isOpen, onClose }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await matchApi.getLeaderboard(20);
      setLeaders(res.data.leaderboard || []);
    } catch (err) {
      setError('Could not load leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const avatarMap = {
    robot: '🤖',
    ninja: '🥷',
    wizard: '🧙',
    cyberpunk: '⚡',
    skull: '💀',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0e1424] border border-[#233052] p-6 shadow-2xl shadow-cyan-500/10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a233a] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2b48]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-arcade font-bold tracking-wide text-white">
                GLOBAL LEADERBOARD
              </h2>
              <p className="text-xs text-slate-400">
                Top contenders ranked by total arena victories & win rate
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playSelect();
              fetchLeaderboard();
            }}
            disabled={loading}
            className="p-2 rounded-lg bg-[#141b2e] border border-[#233052] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Leaders List */}
        <div className="overflow-y-auto mt-4 space-y-2 pr-1">
          {error && (
            <div className="text-center py-8 text-rose-400 text-sm">{error}</div>
          )}

          {loading && leaders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-tech tracking-wider animate-pulse">
              CALCULATING ARENA RANKINGS...
            </div>
          ) : leaders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No ranked matches played yet. Be the first to claim the throne!
            </div>
          ) : (
            leaders.map((player, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              return (
                <div
                  key={player.id || index}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isFirst
                      ? 'bg-gradient-to-r from-amber-950/40 via-[#161c2e] to-[#121829] border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : isSecond
                      ? 'bg-gradient-to-r from-slate-800/40 via-[#161c2e] to-[#121829] border-slate-400/50'
                      : isThird
                      ? 'bg-gradient-to-r from-amber-900/30 via-[#161c2e] to-[#121829] border-amber-700/40'
                      : 'bg-[#111726]/60 border-[#1f2b48] hover:border-[#2f3e66]'
                  }`}
                >
                  {/* Left: Rank & Player info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-7 text-center font-arcade font-bold text-sm">
                      {isFirst ? (
                        <span className="text-amber-400 flex justify-center"><Crown className="w-5 h-5" /></span>
                      ) : isSecond ? (
                        <span className="text-slate-300">#2</span>
                      ) : isThird ? (
                        <span className="text-amber-600">#3</span>
                      ) : (
                        <span className="text-slate-500">#{rank}</span>
                      )}
                    </div>

                    <div className="text-2xl">
                      {avatarMap[player.avatar] || '🤖'}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-100">
                          {player.username}
                        </span>
                        {player.bestStreak > 3 && (
                          <span className="flex items-center text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50">
                            <Flame className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
                            {player.bestStreak} Streak
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="text-emerald-400">{player.wins}W</span>
                        <span>/</span>
                        <span className="text-rose-400">{player.losses}L</span>
                        <span>/</span>
                        <span className="text-slate-400">{player.draws}D</span>
                        <span>•</span>
                        <span>{player.totalMatches} Matches</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Win Rate Bar */}
                  <div className="text-right min-w-[90px]">
                    <div className="text-xs font-arcade font-bold text-cyan-400">
                      {player.winRate}%
                    </div>
                    <div className="w-20 h-1.5 bg-[#090d16] rounded-full overflow-hidden mt-1 ml-auto border border-[#1f2b48]">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, player.winRate))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default LeaderboardModal;
