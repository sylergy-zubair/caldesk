import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WindowControlsProps {
  className?: string;
}

const WindowControls: React.FC<WindowControlsProps> = ({ className = '' }) => {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    // Check initial always on top state
    checkAlwaysOnTop();
  }, []);

  const checkAlwaysOnTop = async () => {
    // We could add an IPC call to check the current state
    // For now, assume false initially
    setIsAlwaysOnTop(false);
  };

  const handleMinimize = async () => {
    try {
      await window.electronAPI.minimizeWindow();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleClose = async () => {
    try {
      await window.electronAPI.closeWindow();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  const handleToggleAlwaysOnTop = async () => {
    try {
      const newState = await window.electronAPI.toggleAlwaysOnTop();
      setIsAlwaysOnTop(newState);
    } catch (error) {
      console.error('Failed to toggle always on top:', error);
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Drag handle area */}
      <div 
        className="w-full h-6 cursor-move bg-transparent hover:bg-white/5 transition-colors duration-200 rounded-t-lg"
        style={{ '-webkit-app-region': 'drag' } as any}
      />

      {/* Control buttons */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ 
          opacity: showControls ? 1 : 0,
          y: showControls ? 0 : -10 
        }}
        className="absolute top-1 right-1 flex space-x-1 z-50"
        style={{ '-webkit-app-region': 'no-drag' } as any}
      >
        {/* Always on top toggle */}
        <button
          onClick={handleToggleAlwaysOnTop}
          className={`p-1 rounded transition-colors duration-200 text-xs ${
            isAlwaysOnTop 
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
              : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
          }`}
          title={isAlwaysOnTop ? 'Disable always on top' : 'Enable always on top'}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </button>

        {/* Minimize button */}
        <button
          onClick={handleMinimize}
          className="p-1 rounded bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-colors duration-200"
          title="Hide to tray"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-1 rounded bg-white/10 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200"
          title="Hide to tray"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>

      {/* Settings indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute top-1 left-1 text-xs text-gray-500 dark:text-gray-400"
      >
        CalDesk
      </motion.div>
    </div>
  );
};

export default WindowControls;