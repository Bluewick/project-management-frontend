import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './contexts.js';
import {
  AUTH_EXPIRED_EVENT,
  TOKENS_REFRESHED_EVENT,
  tokenStorage,
} from '../services/api.js';
import { authService } from '../services/auth.service.js';
import { userService } from '../services/user.service.js';
import { disconnectSocket, refreshSocketAuth } from '../services/socket.js';

/**
 * Global authentication session provider.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(() => tokenStorage.hasAnyToken());

  const refreshProfile = useCallback(async () => {
    const envelope = await userService.getMe();
    setUser(envelope.data);
    return envelope.data;
  }, []);

  useEffect(() => {
    if (!tokenStorage.hasAnyToken()) {
      return;
    }

    let isMounted = true;
    userService
      .getMe()
      .then((envelope) => {
        if (isMounted) {
          setUser(envelope.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          tokenStorage.clearTokens();
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      disconnectSocket();
      setUser(null);
      setIsBootstrapping(false);
    };

    const handleTokensRefreshed = () => {
      refreshSocketAuth();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    window.addEventListener(TOKENS_REFRESHED_EVENT, handleTokensRefreshed);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      window.removeEventListener(TOKENS_REFRESHED_EVENT, handleTokensRefreshed);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const envelope = await authService.login(credentials);
    setUser(envelope.data.user);
    return envelope;
  }, []);

  const register = useCallback(async (payload) => {
    const envelope = await authService.register(payload);
    setUser(envelope.data.user);
    return envelope;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      disconnectSocket();
      setUser(null);
    }
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated: Boolean(user),
    isBootstrapping,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
