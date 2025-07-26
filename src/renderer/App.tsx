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
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
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