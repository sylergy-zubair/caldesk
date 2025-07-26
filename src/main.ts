import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleAuthService } from './services/googleAuth.js';
import { GoogleCalendarService } from './services/googleCalendar.js';
import { TokenStorageService } from './services/tokenStorage.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Services
let authService: GoogleAuthService;
let calendarService: GoogleCalendarService;
let tokenStorage: TokenStorageService;

let mainWindow: BrowserWindow | null = null;

// Desktop widget configuration
const createDesktopWidget = (): void => {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  
  // Create the desktop widget window
  mainWindow = new BrowserWindow({
    width: 320,
    height: 400,
    x: screenWidth - 340, // Position near right edge
    y: 20, // Position near top
    frame: false, // Remove window frame
    transparent: true, // Enable transparency
    alwaysOnTop: false, // Don't stay on top of other windows
    skipTaskbar: true, // Don't show in taskbar
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Set window level for desktop widget behavior
  if (process.platform === 'darwin') {
    // macOS: Set to desktop level
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } else if (process.platform === 'win32') {
    // Windows: Set appropriate window level
    mainWindow.setAlwaysOnTop(false);
  }

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
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
  createDesktopWidget();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createDesktopWidget();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});