import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleAuthService } from './services/googleAuth.js';
import { GoogleCalendarService } from './services/googleCalendar.js';
import { TokenStorageService } from './services/tokenStorage.js';
import { WindowManager } from './services/windowManager.js';
import { AutoStartManager } from './services/autoStart.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Services
let authService: GoogleAuthService;
let calendarService: GoogleCalendarService;
let tokenStorage: TokenStorageService;
let windowManager: WindowManager;

let mainWindow: BrowserWindow | null = null;

// Desktop widget configuration
const createDesktopWidget = (): void => {
  windowManager = new WindowManager();
  mainWindow = windowManager.createWindow();
  windowManager.createTray();
};

// Initialize services
const initializeServices = () => {
  try {
    console.log('Initializing services...');
    console.log('Environment check - Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('Environment check - Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    tokenStorage = new TokenStorageService();
    authService = new GoogleAuthService();
    calendarService = new GoogleCalendarService(authService);
    
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

// IPC handlers for authentication
const setupIpcHandlers = () => {
  // Google authentication
  ipcMain.handle('google-auth', async () => {
    try {
      const tokens = await authService.authenticate();
      await tokenStorage.storeTokens(tokens);
      const user = await authService.getUserInfo(tokens.access_token);
      return { tokens, user };
    } catch (error) {
      throw new Error(`Authentication failed: ${error}`);
    }
  });

  // Load stored tokens
  ipcMain.handle('load-stored-auth', async () => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) return null;

      // Check if token is expired and refresh if needed
      if (authService.isTokenExpired(tokens.expires_at)) {
        const refreshedTokens = await authService.refreshToken(tokens.refresh_token);
        await tokenStorage.updateTokens(refreshedTokens);
        const user = await authService.getUserInfo(refreshedTokens.access_token);
        return { tokens: refreshedTokens, user };
      }

      const user = await authService.getUserInfo(tokens.access_token);
      return { tokens, user };
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      await tokenStorage.clearTokens();
      return null;
    }
  });

  // Logout
  ipcMain.handle('logout', async () => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (tokens) {
        await authService.revokeToken(tokens.access_token);
      }
      await tokenStorage.clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
    }
  });

  // Calendar operations
  ipcMain.handle('get-calendars', async () => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      calendarService.initialize(tokens);
      return await calendarService.getCalendars();
    } catch (error) {
      throw new Error(`Failed to get calendars: ${error}`);
    }
  });

  ipcMain.handle('get-events', async (event, filter) => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      calendarService.initialize(tokens);
      return await calendarService.getEvents(filter);
    } catch (error) {
      throw new Error(`Failed to get events: ${error}`);
    }
  });

  ipcMain.handle('get-todays-events', async () => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      calendarService.initialize(tokens);
      return await calendarService.getTodaysEvents();
    } catch (error) {
      throw new Error(`Failed to get today's events: ${error}`);
    }
  });

  ipcMain.handle('create-event', async (event, calendarId, eventData) => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      calendarService.initialize(tokens);
      return await calendarService.createEvent(calendarId, eventData);
    } catch (error) {
      throw new Error(`Failed to create event: ${error}`);
    }
  });

  ipcMain.handle('update-event', async (event, calendarId, eventId, eventData) => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      calendarService.initialize(tokens);
      return await calendarService.updateEvent(calendarId, eventId, eventData);
    } catch (error) {
      throw new Error(`Failed to update event: ${error}`);
    }
  });

  ipcMain.handle('delete-event', async (event, calendarId, eventId) => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) throw new Error('Not authenticated');
      
      calendarService.initialize(tokens);
      await calendarService.deleteEvent(calendarId, eventId);
    } catch (error) {
      throw new Error(`Failed to delete event: ${error}`);
    }
  });

  // Window controls
  ipcMain.handle('minimize-window', () => {
    windowManager?.hideWindow();
  });

  ipcMain.handle('close-window', () => {
    windowManager?.hideWindow();
  });

  ipcMain.handle('toggle-always-on-top', () => {
    const window = windowManager?.getWindow();
    if (window) {
      const current = window.isAlwaysOnTop();
      windowManager?.toggleAlwaysOnTop(!current);
      return !current;
    }
    return false;
  });

  ipcMain.handle('toggle-window', () => {
    windowManager?.toggleWindow();
  });

  // Auto-start controls
  ipcMain.handle('toggle-auto-start', () => {
    return AutoStartManager.toggle();
  });

  ipcMain.handle('get-auto-start-status', () => {
    return AutoStartManager.isEnabled();
  });

  // Settings
  ipcMain.handle('save-settings', async (event, settings) => {
    // TODO: Implement settings storage
    console.log('Save settings:', settings);
  });

  ipcMain.handle('load-settings', async () => {
    // TODO: Implement settings loading
    return {};
  });
};

// App event handlers
app.whenReady().then(() => {
  initializeServices();
  setupIpcHandlers();
  AutoStartManager.initialize();
  createDesktopWidget();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createDesktopWidget();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit when all windows are closed - we want to keep running in the tray
  // app.quit() will be called from the tray menu instead
});

app.on('before-quit', () => {
  // Clean up window manager when quitting
  if (windowManager) {
    windowManager.destroy();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});