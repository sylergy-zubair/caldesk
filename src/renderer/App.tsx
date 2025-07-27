import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CalendarWidget from './components/CalendarWidget';
import AuthScreen from './components/AuthScreen';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { isAuthenticated, user, isLoading, error, login, logout, clearError } = useAuth();

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleLogin = async () => {
    try {
      clearError();
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Debug logging
  console.log('App render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user, 'error:', error);

  return (
    <div className={theme}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full h-full p-4"
      >
        <div className="glass-strong rounded-2xl shadow-2xl w-full h-full overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading CalDesk...</p>
                <p className="text-xs text-gray-500">Initializing services...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">Error loading CalDesk</p>
                <p className="text-xs text-gray-500">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="interactive px-4 py-2 glass rounded-lg text-sm hover-glass"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : isAuthenticated && user ? (
            <CalendarWidget user={user} onLogout={handleLogout} />
          ) : (
            <AuthScreen 
              onLogin={handleLogin}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default App;