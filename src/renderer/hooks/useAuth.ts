import { useState, useEffect, useCallback } from 'react';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expires_at: number;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    tokens: null,
    isLoading: true,
    error: null,
  });

  // Load stored authentication on component mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if electronAPI is available
      if (!window.electronAPI || !window.electronAPI.loadStoredAuth) {
        console.warn('Electron API not available during initialization');
        setAuthState({
          isAuthenticated: false,
          user: null,
          tokens: null,
          isLoading: false,
          error: null,
        });
        return;
      }
      
      const authData = await window.electronAPI.loadStoredAuth();
      
      if (authData) {
        setAuthState({
          isAuthenticated: true,
          user: authData.user,
          tokens: authData.tokens,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          tokens: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: 'Failed to load authentication',
      });
    }
  };

  const login = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if electronAPI is available
      if (!window.electronAPI) {
        throw new Error('Electron API not available. Make sure you are running in Electron environment.');
      }
      
      if (!window.electronAPI.googleAuth) {
        throw new Error('Google Auth API not available. Preload script may not be loaded properly.');
      }
      
      const authData = await window.electronAPI.googleAuth();
      
      setAuthState({
        isAuthenticated: true,
        user: authData.user,
        tokens: authData.tokens,
        isLoading: false,
        error: null,
      });

      return authData;
    } catch (error) {
      console.error('Authentication failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await window.electronAPI.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    logout,
    clearError,
    refresh: loadStoredAuth,
  };
};