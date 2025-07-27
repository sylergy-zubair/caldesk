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
    // Give a small delay to ensure the preload script has run
    const timer = setTimeout(() => {
      loadStoredAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const loadStoredAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('Starting auth check...');
      console.log('electronAPI available:', !!window.electronAPI);
      console.log('loadStoredAuth available:', !!(window.electronAPI?.loadStoredAuth));
      
      // Check if electronAPI is available
      if (!window.electronAPI) {
        console.error('Window electronAPI not available');
        setAuthState({
          isAuthenticated: false,
          user: null,
          tokens: null,
          isLoading: false,
          error: 'Electron API not found. Please restart the application.',
        });
        return;
      }
      
      if (!window.electronAPI.loadStoredAuth) {
        console.error('loadStoredAuth method not available');
        setAuthState({
          isAuthenticated: false,
          user: null,
          tokens: null,
          isLoading: false,
          error: 'Authentication service not available. Please restart the application.',
        });
        return;
      }
      
      console.log('Calling loadStoredAuth...');
      const authData = await window.electronAPI.loadStoredAuth();
      console.log('Auth data received:', authData);
      
      if (authData && authData.user) {
        console.log('User found, setting authenticated state');
        setAuthState({
          isAuthenticated: true,
          user: authData.user,
          tokens: authData.tokens,
          isLoading: false,
          error: null,
        });
      } else {
        console.log('No user found, setting unauthenticated state');
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
      // Don't show error, just proceed as unauthenticated
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null, // Remove the error to show login screen instead
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