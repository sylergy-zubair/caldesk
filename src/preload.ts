import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Settings persistence
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // System information
  getPlatform: () => process.platform,
  
  // Future: Google Calendar API bridge
  // googleAuth: () => ipcRenderer.invoke('google-auth'),
  // googleCalendar: {
  //   getEvents: (params: any) => ipcRenderer.invoke('google-calendar-get-events', params),
  //   createEvent: (event: any) => ipcRenderer.invoke('google-calendar-create-event', event),
  //   updateEvent: (eventId: string, event: any) => ipcRenderer.invoke('google-calendar-update-event', eventId, event),
  //   deleteEvent: (eventId: string) => ipcRenderer.invoke('google-calendar-delete-event', eventId),
  // }
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      saveSettings: (settings: any) => Promise<void>;
      loadSettings: () => Promise<any>;
      getPlatform: () => string;
    };
  }
}