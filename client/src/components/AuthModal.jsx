import React, { useState } from 'react';
import { X, LogIn, UserPlus, Shield, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import soundManager from '../services/sound';

export const AuthModal = ({ isOpen, onClose }) => {
  const { user, login, register, logout } = useAuth();
  const [tab, setTab] = useState('login'); // 'login', 'register'
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('robot');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const avatars = [
    { id: 'robot', emoji: '🤖', label: 'Cyborg' },
    { id: 'ninja', emoji: '🥷', label: 'Shinobi' },
    { id: 'wizard', emoji: '🧙', label: 'Mage' },
    { id: 'cyberpunk', emoji: '⚡', label: 'Volt' },
    { id: 'skull', emoji: '💀', label: 'Phantom' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginId, password);
      soundManager.playWin();
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 700);
    } catch (err) {
      soundManager.playLose();
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password, avatar);
      soundManager.playWin();
      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 700);
    } catch (err) {
      soundManager.playLose();
      setError(err.response?.data?.message || 'Registration failed. Try a different username/email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0e1424] border border-[#233052] p-6 shadow-2xl shadow-cyan-500/10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a233a] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 mb-3 shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-xl font-arcade font-bold tracking-wide text-white">
            PLAYER AUTHENTICATION
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Save match records, climb global leaderboards, and showcase win streaks
          </p>
        </div>

        {/* Current User Status Banner if Logged in or Guest */}
        {user && (
          <div className="mb-4 p-3 rounded-xl bg-[#141c30] border border-[#1f2b48] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">
                {avatars.find((a) => a.id === user.avatar)?.emoji || '🤖'}
              </span>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-slate-200">{user.username}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    user.isGuest ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  }`}>
                    {user.isGuest ? 'Guest' : 'Verified'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {user.stats?.wins || 0} Wins • {user.stats?.totalMatches || 0} Matches ({user.stats?.winRate || 0}%)
                </div>
              </div>
            </div>
            {!user.isGuest && (
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="text-xs px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/50 transition-all"
              >
                Sign Out
              </button>
            )}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#090d16] rounded-xl border border-[#1f2b48] mb-5">
          <button
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter your username or email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-[#233052] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-[#233052] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Arena'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Arena Handle (Username)
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. CyberViper"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-[#233052] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@arcade.io"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-[#233052] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Secret Password (min 6 chars)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090d16] border border-[#233052] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Choose Avatar
              </label>
              <div className="flex items-center justify-between gap-1.5">
                {avatars.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => {
                      soundManager.playSelect();
                      setAvatar(a.id);
                    }}
                    className={`flex-1 py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      avatar === a.id
                        ? 'bg-pink-950/50 border-pink-500 shadow-md shadow-pink-500/20'
                        : 'bg-[#141b2e] border-[#233052] hover:border-slate-500'
                    }`}
                  >
                    <span className="text-xl">{a.emoji}</span>
                    <span className="text-[10px] text-slate-300 mt-0.5">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-500/25 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Profile'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
