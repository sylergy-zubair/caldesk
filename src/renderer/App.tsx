import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CalendarWidget from './components/CalendarWidget';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  return (
    <div className={theme}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full h-full p-4"
      >
        <div className="glass-strong rounded-2xl shadow-2xl w-full h-full overflow-hidden">
          <CalendarWidget />
        </div>
      </motion.div>
    </div>
  );
};

export default App;