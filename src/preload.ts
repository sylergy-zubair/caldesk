import { contextBridge, ipcRenderer } from 'electron';

console.log('🔧 Preload script starting...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  toggleWindow: () => ipcRenderer.invoke('toggle-window'),
  
  // Settings persistence
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // System information
  getPlatform: () => process.platform,
  
  // Authentication
  googleAuth: () => ipcRenderer.invoke('google-auth'),
  loadStoredAuth: () => ipcRenderer.invoke('load-stored-auth'),
  logout: () => ipcRenderer.invoke('logout'),
  
  // Google Calendar API
  googleCalendar: {
    getCalendars: () => ipcRenderer.invoke('get-calendars'),
    getEvents: (filter?: any) => ipcRenderer.invoke('get-events', filter),
    getTodaysEvents: (calendarIds?: string[]) => ipcRenderer.invoke('get-todays-events', calendarIds),
    createEvent: (calendarId: string, eventData: any) => ipcRenderer.invoke('create-event', calendarId, eventData),
    updateEvent: (calendarId: string, eventId: string, eventData: any) => ipcRenderer.invoke('update-event', calendarId, eventId, eventData),
    deleteEvent: (calendarId: string, eventId: string) => ipcRenderer.invoke('delete-event', calendarId, eventId),
  },
  
  // Notifications
  notifications: {
    scheduleEventNotifications: (events: any[]) => ipcRenderer.invoke('schedule-event-notifications', events),
    showNotification: (title: string, body: string, urgency?: 'low' | 'normal' | 'critical') => ipcRenderer.invoke('show-notification', title, body, urgency),
    clearNotifications: () => ipcRenderer.invoke('clear-notifications'),
  },

  // Window customization
  window: {
    setSizePreset: (size: 'small' | 'medium' | 'large') => ipcRenderer.invoke('set-size-preset', size),
    setCustomSize: (width: number, height: number) => ipcRenderer.invoke('set-custom-size', width, height),
    setOpacity: (opacity: number) => ipcRenderer.invoke('set-opacity', opacity),
    getSizePresets: () => ipcRenderer.invoke('get-size-presets'),
  }
});

console.log('✅ Preload script completed - electronAPI should be available');

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      toggleAlwaysOnTop: () => Promise<boolean>;
      toggleWindow: () => Promise<void>;
      saveSettings: (settings: any) => Promise<void>;
      loadSettings: () => Promise<any>;
      getPlatform: () => string;
      googleAuth: () => Promise<{ tokens: any; user: any }>;
      loadStoredAuth: () => Promise<{ tokens: any; user: any } | null>;
      logout: () => Promise<void>;
      googleCalendar: {
        getCalendars: () => Promise<any[]>;
        getEvents: (filter?: any) => Promise<any[]>;
        getTodaysEvents: (calendarIds?: string[]) => Promise<any[]>;
        createEvent: (calendarId: string, eventData: any) => Promise<any>;
        updateEvent: (calendarId: string, eventId: string, eventData: any) => Promise<any>;
        deleteEvent: (calendarId: string, eventId: string) => Promise<void>;
      };
      notifications: {
        scheduleEventNotifications: (events: any[]) => Promise<void>;
        showNotification: (title: string, body: string, urgency?: 'low' | 'normal' | 'critical') => Promise<void>;
        clearNotifications: () => Promise<void>;
      };
      window: {
        setSizePreset: (size: 'small' | 'medium' | 'large') => Promise<void>;
        setCustomSize: (width: number, height: number) => Promise<void>;
        setOpacity: (opacity: number) => Promise<void>;
        getSizePresets: () => Promise<Record<string, { width: number; height: number; label: string }>>;
      };
    };
  }
}