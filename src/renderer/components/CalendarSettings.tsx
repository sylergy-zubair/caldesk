import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarInfo {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  selected?: boolean;
}

interface CalendarSettingsProps {
  calendars: CalendarInfo[];
  isOpen: boolean;
  onClose: () => void;
  onCalendarToggle: (calendarId: string, enabled: boolean) => void;
}

interface SizePreset {
  width: number;
  height: number;
  label: string;
}

const CalendarSettings: React.FC<CalendarSettingsProps> = ({
  calendars,
  isOpen,
  onClose,
  onCalendarToggle,
}) => {
  const [localCalendars, setLocalCalendars] = useState(calendars);
  const [sizePresets, setSizePresets] = useState<Record<string, SizePreset>>({});
  const [currentOpacity, setCurrentOpacity] = useState(95);
  const [currentSize, setCurrentSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [activeTab, setActiveTab] = useState<'calendars' | 'appearance'>('calendars');

  React.useEffect(() => {
    setLocalCalendars(calendars);
  }, [calendars]);

  React.useEffect(() => {
    if (isOpen) {
      // Load size presets when modal opens
      window.electronAPI.window.getSizePresets().then(presets => {
        setSizePresets(presets);
      });
    }
  }, [isOpen]);

  const handleToggle = (calendarId: string, enabled: boolean) => {
    setLocalCalendars(prev => 
      prev.map(cal => 
        cal.id === calendarId ? { ...cal, selected: enabled } : cal
      )
    );
    onCalendarToggle(calendarId, enabled);
  };

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    setCurrentSize(size);
    window.electronAPI.window.setSizePreset(size);
  };

  const handleOpacityChange = (opacity: number) => {
    setCurrentOpacity(opacity);
    window.electronAPI.window.setOpacity(opacity / 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-4 glass rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={onClose}
                className="interactive p-2 rounded-lg hover-glass transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('calendars')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'calendars'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Calendars
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'appearance'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Appearance
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {activeTab === 'calendars' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                    Select calendars to display:
                  </h3>
                  
                  {localCalendars.map((calendar) => (
                    <motion.div
                      key={calendar.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-3 p-3 glass rounded-lg hover-glass transition-all duration-200"
                    >
                      {/* Calendar color indicator */}
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: calendar.backgroundColor || '#1976d2' }}
                      />
                      
                      {/* Calendar info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium truncate">
                            {calendar.summary}
                          </p>
                          {calendar.primary && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        {calendar.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {calendar.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Toggle switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={calendar.selected !== false}
                          onChange={(e) => handleToggle(calendar.id, e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  {/* Widget Size */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                      Widget Size
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(sizePresets).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => handleSizeChange(key as 'small' | 'medium' | 'large')}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            currentSize === key
                              ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                          }`}
                        >
                          <div className="text-sm font-medium">{preset.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {preset.width}×{preset.height}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opacity */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                      Opacity ({currentOpacity}%)
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={currentOpacity}
                        onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick opacity presets */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Quick Presets
                    </h4>
                    <div className="flex gap-2">
                      {[70, 80, 90, 95, 100].map((opacity) => (
                        <button
                          key={opacity}
                          onClick={() => handleOpacityChange(opacity)}
                          className={`px-3 py-1 rounded-md text-sm transition-all duration-200 ${
                            currentOpacity === opacity
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {opacity}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {localCalendars.filter(cal => cal.selected !== false).length} of {localCalendars.length} calendars selected
                </p>
                <button
                  onClick={onClose}
                  className="interactive px-4 py-2 glass-strong rounded-lg text-sm font-medium hover-glass transition-all duration-200"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CalendarSettings;