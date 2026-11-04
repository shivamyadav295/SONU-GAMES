import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rps_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('rps_auth_token'));
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('rps_auth_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('rps_user_profile', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Could not verify existing token, starting fresh guest session');
          await autoStartGuest();
        }
      } else {
        await autoStartGuest();
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const autoStartGuest = async () => {
    try {
      const res = await authApi.guestLogin();
      const { user: guestUser, token: guestToken } = res.data;
      setUser(guestUser);
      setToken(guestToken);
      localStorage.setItem('rps_auth_token', guestToken);
      localStorage.setItem('rps_user_profile', JSON.stringify(guestUser));
    } catch (err) {
      // Offline fallback guest
      const localGuest = {
        id: 'local_guest_' + Math.floor(1000 + Math.random() * 9000),
        username: 'Guest_' + Math.floor(100 + Math.random() * 900),
        isGuest: true,
        avatar: 'robot',
        stats: { wins: 0, losses: 0, draws: 0, totalMatches: 0, winRate: 0, currentStreak: 0, bestStreak: 0 },
      };
      setUser(localGuest);
      localStorage.setItem('rps_user_profile', JSON.stringify(localGuest));
    }
  };

  const login = async (loginId, password) => {
    const res = await authApi.login({ loginId, password });
    const { user: loggedInUser, token: authToken } = res.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('rps_auth_token', authToken);
    localStorage.setItem('rps_user_profile', JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const register = async (regData, email, password, avatar) => {
    // Support both register({ username, email, phone, password, avatar }) or register(username, email, password, avatar)
    const payload = typeof regData === 'object'
      ? regData
      : { username: regData, email, password, avatar };

    const res = await authApi.register(payload);
    const { user: registeredUser, token: authToken } = res.data;
    setUser(registeredUser);
    setToken(authToken);
    localStorage.setItem('rps_auth_token', authToken);
    localStorage.setItem('rps_user_profile', JSON.stringify(registeredUser));
    return { user: registeredUser, recoveryCode: res.data.recoveryCode };
  };

  const recoverAccount = async (recoveryData) => {
    const res = await authApi.recoverAccount(recoveryData);
    const { user: recoveredUser, token: authToken } = res.data;
    setUser(recoveredUser);
    setToken(authToken);
    localStorage.setItem('rps_auth_token', authToken);
    localStorage.setItem('rps_user_profile', JSON.stringify(recoveredUser));
    return { user: recoveredUser, recoveryCode: res.data.recoveryCode };
  };

  const createRecoveryCode = async () => {
    const res = await authApi.createRecoveryCode();
    return res.data.recoveryCode;
  };

  const updateProfile = async (profileData) => {
    const res = await authApi.updateProfile(profileData);
    const { user: updatedUser, token: updatedToken } = res.data;
    setUser(updatedUser);
    if (updatedToken) {
      setToken(updatedToken);
      localStorage.setItem('rps_auth_token', updatedToken);
    }
    localStorage.setItem('rps_user_profile', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const logout = async () => {
    localStorage.removeItem('rps_auth_token');
    localStorage.removeItem('rps_user_profile');
    setToken(null);
    await autoStartGuest();
  };

  const updateStatsLocally = (result) => {
    setUser((prev) => {
      if (!prev) return prev;
      const stats = { ...(prev.stats || { wins: 0, losses: 0, draws: 0, totalMatches: 0, winRate: 0, currentStreak: 0, bestStreak: 0 }) };
      stats.totalMatches += 1;

      if (result === 'win') {
        stats.wins += 1;
        stats.currentStreak += 1;
        if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;
      } else if (result === 'loss') {
        stats.losses += 1;
        stats.currentStreak = 0;
      } else if (result === 'draw') {
        stats.draws += 1;
      }

      stats.winRate = stats.totalMatches > 0
        ? Math.round((stats.wins / stats.totalMatches) * 1000) / 10
        : 0;

      const updated = { ...prev, stats };
      localStorage.setItem('rps_user_profile', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshProfile = async () => {
    if (token && user && !user.isGuest) {
      try {
        const res = await authApi.getMe();
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('rps_user_profile', JSON.stringify(res.data.user));
        }
      } catch (err) {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        recoverAccount,
        createRecoveryCode,
        updateProfile,
        logout,
        autoStartGuest,
        updateStatsLocally,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
