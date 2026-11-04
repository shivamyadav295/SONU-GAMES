import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Shield,
  ShieldCheck,
  Lock,
  User,
  Copy,
  Check,
  Eye,
  EyeOff,
  Flame,
  Award,
  AlertCircle,
  CheckCircle2,
  Settings,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import soundManager from '../services/sound';

export const AuthModal = ({ isOpen, onClose }) => {
  const { user, login, register, recoverAccount, createRecoveryCode, updateProfile, logout } = useAuth();

  // Mode: 'login', 'register', 'recover', 'profile'
  const [tab, setTab] = useState(user && !user.isGuest ? 'profile' : 'login');

  // Form states
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [copiedRecoveryCode, setCopiedRecoveryCode] = useState(false);

  // Register fields
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('robot');

  // Profile Edit fields
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('robot');
  const [maskContact, setMaskContact] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const avatars = [
    { id: 'robot', emoji: '🤖', label: 'Cyborg' },
    { id: 'ninja', emoji: '🥷', label: 'Shinobi' },
    { id: 'wizard', emoji: '🧙', label: 'Mage' },
    { id: 'cyberpunk', emoji: '⚡', label: 'Volt' },
    { id: 'skull', emoji: '💀', label: 'Phantom' },
  ];

  // Sync edit fields when user changes
  useEffect(() => {
    if (user) {
      setEditUsername(user.username || '');
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
      setEditAvatar(user.avatar || 'robot');
      setMaskContact(user.privacy?.maskContact ?? true);
      if (!user.isGuest) {
        setTab('profile');
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Masking helpers for security and privacy
  const maskPhoneDisplay = (p) => {
    if (!p) return 'Not added';
    if (!maskContact) return p;
    if (p.length <= 4) return '••••';
    const last4 = p.slice(-4);
    return `${p.slice(0, 3)} •••• ••${last4}`;
  };

  const maskEmailDisplay = (e) => {
    if (!e) return 'Not added';
    if (!maskContact) return e;
    const parts = e.split('@');
    if (parts.length !== 2) return '••••••••';
    const name = parts[0];
    const maskedName = name.length > 2 ? `${name[0]}••••${name[name.length - 1]}` : `${name[0]}••••`;
    return `${maskedName}@${parts[1]}`;
  };

  const handleCopyId = () => {
    const id = user?._id || user?.id || '';
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginId, password);
      soundManager.playWin();
      setSuccessMsg('Authentication verified! Welcome back.');
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
    setRecoveryCode('');
    setLoading(true);
    try {
      const result = await register({
        username: username.trim(),
        password,
        avatar,
        privacy: { maskContact },
      });
      soundManager.playWin();
      setRecoveryCode(result.recoveryCode || '');
      setSuccessMsg('Account created! Save your recovery code from your profile.');
    } catch (err) {
      soundManager.playLose();
      setError(err.response?.data?.message || 'Registration failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverAccount = async (e) => {
    e.preventDefault();
    setError('');
    setRecoveryCode('');
    setLoading(true);
    try {
      const result = await recoverAccount({
        recoveryCode: recoveryCodeInput,
        newPassword: recoveryPassword,
      });
      setRecoveryCode(result.recoveryCode || '');
      setRecoveryPassword('');
      setSuccessMsg(`Welcome back, ${result.user.username}. Your password has been reset.`);
      soundManager.playWin();
    } catch (err) {
      soundManager.playLose();
      setError(err.response?.data?.message || 'Account recovery failed. Check your recovery code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecoveryCode = async () => {
    setError('');
    setSuccessMsg('');
    setRecoveryCode('');
    setLoading(true);
    try {
      const code = await createRecoveryCode();
      setRecoveryCode(code);
      setSuccessMsg('Save this new recovery code. It replaces any previous code.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create a recovery code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRecoveryCode = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopiedRecoveryCode(true);
      setTimeout(() => setCopiedRecoveryCode(false), 2000);
    } catch {
      setError('Could not copy the recovery code. Please select and copy it manually.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const payload = {
        username: editUsername,
        email: editEmail,
        phone: editPhone,
        avatar: editAvatar,
        privacy: { maskContact },
      };

      if (showChangePassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload);
      soundManager.playWin();
      setSuccessMsg('Profile and privacy settings saved successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setShowChangePassword(false);
    } catch (err) {
      soundManager.playLose();
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0c111e] border border-[#233052] p-5 sm:p-6 shadow-2xl shadow-cyan-500/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a233a] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-600 mb-2.5 shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-lg sm:text-xl font-arcade font-bold tracking-wide text-white">
            {tab === 'profile' ? 'PLAYER PROFILE & SECURITY' : 'AUTHENTICATION ARENA'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tab === 'profile'
              ? 'Manage your account credentials, contact privacy, and combat statistics'
              : 'Create an account with a username and password to save your progress'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#070b14] rounded-xl border border-[#1f2b48] mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
              setSuccessMsg('');
              setRecoveryCode('');
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
              tab === 'login'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
              setSuccessMsg('');
              setRecoveryCode('');
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
              tab === 'register'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('profile');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
              tab === 'profile'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800/70 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/70 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ----------------- TAB: SIGN IN ----------------- */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Your username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#233052] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Use your username and password to sign in.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#233052] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Privacy & Security reassurance banner */}
            <div className="p-2.5 rounded-xl bg-[#101728] border border-[#1e2a47] flex items-center space-x-2 text-[11px] text-slate-400">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Protected session: Credential hashing with bcrypt and stateless JWT verification.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Arena'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('recover');
                setError('');
                setSuccessMsg('');
              }}
              className="w-full text-xs font-medium text-cyan-700 hover:text-cyan-800"
            >
              Forgot username or password? Use a recovery code
            </button>
          </form>
        )}

        {tab === 'recover' && (
          <form onSubmit={handleRecoverAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Recovery Code
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                maxLength={39}
                value={recoveryCodeInput}
                onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#233052] text-sm font-mono tracking-wider text-slate-100 placeholder-slate-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Your username will be restored and you can choose a new password.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={recoveryPassword}
                onChange={(e) => setRecoveryPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-[#233052] text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-50"
            >
              {loading ? 'Recovering account...' : 'Recover Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className="w-full text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Back to sign in
            </button>
          </form>
        )}

        {/* ----------------- TAB: CREATE ACCOUNT ----------------- */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5" autoComplete="off">
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
                className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#233052] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#070b14] border border-[#233052] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Choose Combat Avatar
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {avatars.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => {
                      soundManager.playSelect();
                      setAvatar(a.id);
                    }}
                    className={`py-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      avatar === a.id
                        ? 'bg-pink-950/60 border-pink-500 shadow-md shadow-pink-500/20'
                        : 'bg-[#101726] border-[#233052] hover:border-slate-500'
                    }`}
                  >
                    <span className="text-xl">{a.emoji}</span>
                    <span className="text-[9px] text-slate-300 mt-0.5">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy & Security Guarantee Banner */}
            <div className="p-3 rounded-xl bg-[#0a101d] border border-cyan-900/40 text-[11px] text-slate-300 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan-300 block">Data Privacy & Security Guarantee:</span>
                <span className="text-slate-400">
                  Keep your recovery code safe. It can reset your password and reveal your username.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-500/25 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* ----------------- TAB: PROFILE MANAGEMENT ----------------- */}
        {tab === 'profile' && (
          <div className="space-y-4">
            {recoveryCode ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-900 block">
                  Save your one-time recovery code
                </span>
                <p className="text-[11px] text-amber-800 mt-1">
                  It can restore your username and reset your password. We cannot show it again.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 rounded-lg bg-white border border-amber-200 px-3 py-2 text-sm font-mono font-bold tracking-wider text-slate-800 select-all">
                    {recoveryCode}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyRecoveryCode}
                    className="p-2 rounded-lg bg-white border border-amber-200 text-amber-900 hover:bg-amber-100"
                    title="Copy recovery code"
                  >
                    {copiedRecoveryCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : !user?.isGuest ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] text-slate-600">
                  Forgot your password? A recovery code lets you regain access without losing your account.
                </p>
                <button
                  type="button"
                  onClick={handleCreateRecoveryCode}
                  disabled={loading}
                  className="shrink-0 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create recovery code'}
                </button>
              </div>
            ) : null}

            {/* User ID & Badges Card */}
            <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#233052] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-1.5 rounded-xl bg-[#141d33] border border-[#233052]">
                  {avatars.find((a) => a.id === user?.avatar)?.emoji || '🤖'}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-white">{user?.username || 'Player'}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        user?.isGuest
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {user?.isGuest ? 'Guest Session' : 'Verified ID'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-500">
                      ID: {user?._id || user?.id || 'N/A'}
                    </span>
                    <button
                      onClick={handleCopyId}
                      title="Copy User ID"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-all"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Combat Stats summary pills */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-1.5 rounded-lg bg-[#0e1628] border border-[#1d273e]">
                  <span className="text-slate-400 text-[10px] block">Wins</span>
                  <span className="font-bold text-emerald-400">{user?.stats?.wins || 0}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#0e1628] border border-[#1d273e]">
                  <span className="text-slate-400 text-[10px] block">Rate</span>
                  <span className="font-bold text-cyan-400">{user?.stats?.winRate || 0}%</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#0e1628] border border-[#1d273e]">
                  <span className="text-slate-400 text-[10px] block">Streak</span>
                  <span className="font-bold text-amber-400">{user?.stats?.bestStreak || 0}🔥</span>
                </div>
              </div>
            </div>

            {/* Guest Upgrade Callout if guest */}
            {user?.isGuest && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-300 block">Guest Account in Use</span>
                  <span className="text-[11px] text-slate-300">
                    Create a username and password to save this profile and stats permanently.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shrink-0 transition-all"
                >
                  Save ID
                </button>
              </div>
            )}

            {/* Edit Profile Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-[#233052] text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    autoComplete="off"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-[#233052] text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  autoComplete="off"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. player@arcade.io"
                  className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-[#233052] text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Update Avatar
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {avatars.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => {
                        soundManager.playSelect();
                        setEditAvatar(a.id);
                      }}
                      className={`py-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        editAvatar === a.id
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-[#0f1627] border-[#233052] hover:border-slate-500'
                      }`}
                    >
                      <span className="text-xl">{a.emoji}</span>
                      <span className="text-[9px] text-slate-300 mt-0.5">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Toggle */}
              <div className="p-3 rounded-xl bg-[#070b14] border border-[#1f2b48] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Contact Privacy Masking</span>
                  <span className="text-[11px] text-slate-400">
                    Mask phone and email on screen ({maskPhoneDisplay(editPhone)} • {maskEmailDisplay(editEmail)})
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="maskToggle"
                  checked={maskContact}
                  onChange={(e) => setMaskContact(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 border-gray-700 bg-gray-900 cursor-pointer"
                />
              </div>

              {/* Toggle Change Password Section */}
              <div className="border-t border-[#1f2b48] pt-3">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{showChangePassword ? 'Hide Password Change' : 'Change Password / Set Secret Key'}</span>
                </button>

                {showChangePassword && (
                  <div className="mt-3 p-3 rounded-xl bg-[#070b14] border border-[#233052] space-y-3">
                    {user?.password && (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current secret password"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0c111e] border border-[#233052] text-xs text-white"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        New Password (min 6 characters)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New secret password"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#0c111e] border border-[#233052] text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Save & Sign Out buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>

                {!user?.isGuest && (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-all"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
