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
    getTodaysEvents: () => ipcRenderer.invoke('get-todays-events'),
    createEvent: (calendarId: string, eventData: any) => ipcRenderer.invoke('create-event', calendarId, eventData),
    updateEvent: (calendarId: string, eventId: string, eventData: any) => ipcRenderer.invoke('update-event', calendarId, eventId, eventData),
    deleteEvent: (calendarId: string, eventId: string) => ipcRenderer.invoke('delete-event', calendarId, eventId),
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
        getTodaysEvents: () => Promise<any[]>;
        createEvent: (calendarId: string, eventData: any) => Promise<any>;
        updateEvent: (calendarId: string, eventId: string, eventData: any) => Promise<any>;
        deleteEvent: (calendarId: string, eventId: string) => Promise<void>;
      };
    };
  }
}