import React, { useEffect, useState } from 'react';
import { History, X, RefreshCw, Bot, User, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { matchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import soundManager from '../services/sound';

export const MatchHistoryModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await matchApi.getHistory(20);
      setMatches(res.data.matches || []);
    } catch (err) {
      setError('Could not retrieve match history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const moveEmoji = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️',
    timeout: '⌛',
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <History className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-arcade font-bold tracking-wide text-white">
                MATCH ARCHIVES
              </h2>
              <p className="text-xs text-slate-400">
                Log of past single-player & multiplayer duels
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playSelect();
              fetchHistory();
            }}
            disabled={loading}
            className="p-2 rounded-lg bg-[#141b2e] border border-[#233052] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all disabled:opacity-50"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Matches List */}
        <div className="overflow-y-auto mt-4 space-y-3 pr-1">
          {error && (
            <div className="text-center py-8 text-rose-400 text-sm">{error}</div>
          )}

          {loading && matches.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-tech tracking-wider animate-pulse">
              RETRIEVING COMBAT LOGS...
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No recorded battles yet. Jump into the arena and make your first move!
            </div>
          ) : (
            matches.map((m, idx) => {
              const currentUserId = user?._id || user?.id;
              const isP1 = m.player1?.id === currentUserId;
              const myPlayer = isP1 ? m.player1 : m.player2;
              const oppPlayer = isP1 ? m.player2 : m.player1;

              const isWinner = m.winner?.id === myPlayer?.id;
              const isDraw = m.winner?.id === 'draw';

              const dateStr = m.createdAt
                ? new Date(m.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              return (
                <div
                  key={m._id || m.id || idx}
                  className="p-3.5 rounded-xl bg-[#111726]/80 border border-[#1f2b48] hover:border-[#2f3e66] transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isWinner
                            ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-400'
                            : isDraw
                            ? 'bg-amber-950/60 border-amber-600/50 text-amber-400'
                            : 'bg-rose-950/60 border-rose-600/50 text-rose-400'
                        }`}
                      >
                        {isWinner ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
                      </span>
                      <span className="text-xs font-arcade text-slate-400">
                        {m.mode === 'pvc' ? 'vs AI BOT' : 'ONLINE PVP'}
                      </span>
                      {m.targetWins && (
                        <span className="text-[10px] text-slate-500 font-tech">
                          (First to {m.targetWins})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">{dateStr}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-[#1a233a]">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-semibold text-cyan-400">
                        {myPlayer?.username || 'You'} ({myPlayer?.score || 0})
                      </span>
                      <span className="text-slate-600 font-arcade text-xs">VS</span>
                      <span className="text-xs font-semibold text-pink-400">
                        {oppPlayer?.username || 'Opponent'} ({oppPlayer?.score || 0})
                      </span>
                    </div>

                    {/* Rounds Moves Badges */}
                    {m.rounds && m.rounds.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {m.rounds.map((r, rIdx) => {
                          const myMove = isP1 ? r.p1Move : r.p2Move;
                          const oppMove = isP1 ? r.p2Move : r.p1Move;
                          return (
                            <span
                              key={rIdx}
                              className="text-xs px-1.5 py-0.5 rounded bg-[#161f36] border border-[#233052]"
                              title={`Round ${r.roundNumber || rIdx + 1}: ${myMove} vs ${oppMove}`}
                            >
                              {moveEmoji[myMove] || '❓'}
                            </span>
                          );
                        })}
                      </div>
                    )}
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

export default MatchHistoryModal;
