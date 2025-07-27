import { BrowserWindow, screen, app, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { AutoStartManager } from './autoStart.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface WindowSettings {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  alwaysOnTop?: boolean;
  autoHide?: boolean;
  showInTaskbar?: boolean;
  opacity?: number;
  desktopWidget?: boolean; // True desktop widget mode
  size?: 'small' | 'medium' | 'large' | 'custom';
}

export interface SizePreset {
  width: number;
  height: number;
  label: string;
}

export class WindowManager {
  private window: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private settingsPath: string;
  private sizePresets: Record<string, SizePreset> = {
    small: { width: 320, height: 450, label: 'Small' },
    medium: { width: 380, height: 600, label: 'Medium' },
    large: { width: 450, height: 750, label: 'Large' },
  };
  private defaultSettings: WindowSettings = {
    width: 380,
    height: 600,
    alwaysOnTop: false,
    autoHide: false,
    showInTaskbar: false,
    opacity: 0.95,
    desktopWidget: true, // Enable desktop widget mode by default
    size: 'medium',
  };

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'window-settings.json');
  }

  /**
   * Create the main desktop widget window
   */
  createWindow(): BrowserWindow {
    const settings = this.loadSettings();
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
    
    // Smart positioning: default to top-right if no saved position
    const defaultX = screenWidth - (settings.width || this.defaultSettings.width!) - 20;
    const defaultY = 20;

    // Production preload path - go up one level from services to dist root
    const preloadPath = path.join(__dirname, '..', 'preload.js');
    console.log('Preload script path:', preloadPath);
    console.log('Preload script exists:', fs.existsSync(preloadPath));

    const windowOptions: any = {
      width: settings.width || this.defaultSettings.width,
      height: settings.height || this.defaultSettings.height,
      x: settings.x ?? defaultX,
      y: settings.y ?? defaultY,
      frame: false,
      transparent: true,
      alwaysOnTop: settings.alwaysOnTop || this.defaultSettings.alwaysOnTop,
      skipTaskbar: !(settings.showInTaskbar ?? this.defaultSettings.showInTaskbar),
      resizable: true,
      movable: true,
      minimizable: true,
      maximizable: false,
      closable: false, // Prevent accidental closing
      show: false,
      opacity: settings.opacity || this.defaultSettings.opacity,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
      },
    };

    // Configure for desktop widget mode
    if (settings.desktopWidget ?? this.defaultSettings.desktopWidget) {
      if (process.platform === 'win32') {
        // Windows: Use type 'desktop' to place behind other windows
        windowOptions.type = 'desktop';
        windowOptions.alwaysOnTop = false;
        windowOptions.skipTaskbar = true;
      } else if (process.platform === 'darwin') {
        // macOS: Set window level to desktop
        windowOptions.level = 'desktop';
        windowOptions.alwaysOnTop = false;
      } else {
        // Linux: Use type 'desktop'
        windowOptions.type = 'desktop';
        windowOptions.alwaysOnTop = false;
      }
    }

    this.window = new BrowserWindow(windowOptions);

    // Platform-specific window behavior
    this.configurePlatformBehavior();

    // Set up window event handlers
    this.setupWindowEvents();

    // Load the app
    this.loadContent();

    return this.window;
  }

  /**
   * Create system tray
   */
  createTray(): void {
    if (this.tray) return;

    // Create tray icon (you'd want to add actual icon files)
    const iconPath = this.createTrayIcon();
    this.tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show CalDesk',
        click: () => this.showWindow(),
      },
      {
        label: 'Hide CalDesk',
        click: () => this.hideWindow(),
      },
      { type: 'separator' },
      {
        label: 'Always on Top',
        type: 'checkbox',
        checked: this.window?.isAlwaysOnTop() || false,
        click: (menuItem) => this.toggleAlwaysOnTop(menuItem.checked),
      },
      {
        label: 'Show in Taskbar',
        type: 'checkbox',
        checked: true, // Default to show in taskbar
        click: (menuItem) => this.toggleTaskbar(menuItem.checked),
      },
      {
        label: 'Desktop Widget Mode',
        type: 'checkbox',
        checked: this.loadSettings().desktopWidget ?? this.defaultSettings.desktopWidget,
        click: (menuItem) => this.toggleDesktopWidget(menuItem.checked),
      },
      { type: 'separator' },
      {
        label: 'Start with System',
        type: 'checkbox',
        checked: AutoStartManager.isEnabled(),
        click: () => AutoStartManager.toggle(),
      },
      { type: 'separator' },
      {
        label: 'Size',
        submenu: [
          { 
            label: 'Small (320×450)', 
            type: 'radio',
            checked: this.loadSettings().size === 'small',
            click: () => this.setSizePreset('small') 
          },
          { 
            label: 'Medium (380×600)', 
            type: 'radio',
            checked: this.loadSettings().size === 'medium',
            click: () => this.setSizePreset('medium') 
          },
          { 
            label: 'Large (450×750)', 
            type: 'radio',
            checked: this.loadSettings().size === 'large',
            click: () => this.setSizePreset('large') 
          },
        ],
      },
      {
        label: 'Opacity',
        submenu: [
          { label: '100%', click: () => this.setOpacity(1.0) },
          { label: '95%', click: () => this.setOpacity(0.95) },
          { label: '90%', click: () => this.setOpacity(0.90) },
          { label: '80%', click: () => this.setOpacity(0.80) },
          { label: '70%', click: () => this.setOpacity(0.70) },
        ],
      },
      { type: 'separator' },
      {
        label: 'Refresh Calendar',
        click: () => this.window?.webContents.send('refresh-calendar'),
      },
      { type: 'separator' },
      {
        label: 'Quit CalDesk',
        click: () => {
          this.saveSettings();
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('CalDesk - Google Calendar Widget');

    // Double-click to toggle window
    this.tray.on('double-click', () => {
      this.toggleWindow();
    });
  }

  /**
   * Toggle window visibility
   */
  toggleWindow(): void {
    if (!this.window) return;

    if (this.window.isVisible()) {
      this.hideWindow();
    } else {
      this.showWindow();
    }
  }

  /**
   * Show window with smart positioning
   */
  showWindow(): void {
    if (!this.window) return;

    // Ensure window is within screen bounds
    this.ensureWindowInBounds();
    
    this.window.show();
    this.window.focus();
  }

  /**
   * Hide window
   */
  hideWindow(): void {
    if (!this.window) return;
    this.window.hide();
  }

  /**
   * Toggle always on top
   */
  toggleAlwaysOnTop(enabled: boolean): void {
    if (!this.window) return;
    this.window.setAlwaysOnTop(enabled);
    this.saveSettings();
  }

  /**
   * Toggle taskbar visibility
   */
  toggleTaskbar(showInTaskbar: boolean): void {
    if (!this.window) return;
    this.window.setSkipTaskbar(!showInTaskbar);
    this.saveSettings();
  }

  /**
   * Set window opacity
   */
  setOpacity(opacity: number): void {
    if (!this.window) return;
    this.window.setOpacity(opacity);
    this.saveSettings();
  }

  /**
   * Toggle desktop widget mode
   */
  toggleDesktopWidget(enabled: boolean): void {
    const settings = this.loadSettings();
    settings.desktopWidget = enabled;
    
    // Save settings first
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to save window settings:', error);
    }
    
    // Recreate window with new settings
    const bounds = this.window?.getBounds();
    if (this.window) {
      this.window.destroy();
    }
    
    this.createWindow();
    
    // Restore bounds if available
    if (bounds && this.window) {
      this.window.setBounds(bounds);
    }
  }

  /**
   * Set window size preset
   */
  setSizePreset(size: 'small' | 'medium' | 'large'): void {
    if (!this.window) return;
    
    const preset = this.sizePresets[size];
    if (!preset) return;
    
    const currentBounds = this.window.getBounds();
    this.window.setBounds({
      x: currentBounds.x,
      y: currentBounds.y,
      width: preset.width,
      height: preset.height,
    });
    
    // Update settings
    const settings = this.loadSettings();
    settings.size = size;
    settings.width = preset.width;
    settings.height = preset.height;
    
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to save window settings:', error);
    }
  }

  /**
   * Get available size presets
   */
  getSizePresets(): Record<string, SizePreset> {
    return this.sizePresets;
  }

  /**
   * Set custom window size
   */
  setCustomSize(width: number, height: number): void {
    if (!this.window) return;
    
    const currentBounds = this.window.getBounds();
    this.window.setBounds({
      x: currentBounds.x,
      y: currentBounds.y,
      width,
      height,
    });
    
    // Update settings
    const settings = this.loadSettings();
    settings.size = 'custom';
    settings.width = width;
    settings.height = height;
    
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to save window settings:', error);
    }
  }

  /**
   * Get current window instance
   */
  getWindow(): BrowserWindow | null {
    return this.window;
  }

  /**
   * Destroy tray and window
   */
  destroy(): void {
    this.saveSettings();
    
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    
    if (this.window) {
      this.window.destroy();
      this.window = null;
    }
  }

  /**
   * Load window settings from file
   */
  private loadSettings(): WindowSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        return { ...this.defaultSettings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load window settings:', error);
    }
    return this.defaultSettings;
  }

  /**
   * Save current window settings
   */
  private saveSettings(): void {
    if (!this.window) return;

    try {
      const bounds = this.window.getBounds();
      const currentSettings = this.loadSettings();
      const settings: WindowSettings = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        alwaysOnTop: this.window.isAlwaysOnTop(),
        showInTaskbar: true, // We'll track this in settings instead
        opacity: this.window.getOpacity(),
        desktopWidget: currentSettings.desktopWidget, // Preserve desktop widget setting
        size: currentSettings.size, // Preserve size setting
      };

      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to save window settings:', error);
    }
  }

  /**
   * Configure platform-specific behavior
   */
  private configurePlatformBehavior(): void {
    if (!this.window) return;

    if (process.platform === 'darwin') {
      // macOS: Enable on all workspaces
      this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } else if (process.platform === 'win32') {
      // Windows: Additional window behavior
      this.window.setMenu(null);
    } else {
      // Linux: Additional configuration
      this.window.setMenu(null);
    }
  }

  /**
   * Set up window event handlers
   */
  private setupWindowEvents(): void {
    if (!this.window) return;

    // Save position when moved or resized
    this.window.on('moved', () => {
      this.saveSettings();
    });

    this.window.on('resized', () => {
      this.saveSettings();
    });

    // Show when ready
    this.window.once('ready-to-show', () => {
      this.showWindow();
    });

    // Prevent closing, hide instead
    this.window.on('close', (event) => {
      event.preventDefault();
      this.hideWindow();
    });

    // Handle focus loss for auto-hide
    this.window.on('blur', () => {
      const settings = this.loadSettings();
      if (settings.autoHide) {
        setTimeout(() => {
          if (this.window && !this.window.isFocused()) {
            this.hideWindow();
          }
        }, 3000); // Hide after 3 seconds of inactivity
      }
    });

    // Prevent navigation
    this.window.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
        event.preventDefault();
      }
    });
  }

  /**
   * Load app content
   */
  private loadContent(): void {
    if (!this.window) return;

    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Loading content...');

    // Always use localhost in development
    if (!app.isPackaged) {
      console.log('Loading development URL: http://localhost:3000');
      this.window.loadURL('http://localhost:3000');
      // this.window.webContents.openDevTools(); // Commented out to prevent auto-opening dev tools
    } else {
      console.log('Loading production file');
      this.window.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
  }

  /**
   * Ensure window is within screen bounds
   */
  private ensureWindowInBounds(): void {
    if (!this.window) return;

    const bounds = this.window.getBounds();
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    let { x, y, width, height } = bounds;

    // Ensure window is not off-screen
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > screenWidth) x = screenWidth - width;
    if (y + height > screenHeight) y = screenHeight - height;

    // If window is still too big, resize it
    if (width > screenWidth) width = screenWidth;
    if (height > screenHeight) height = screenHeight;

    this.window.setBounds({ x, y, width, height });
  }

  /**
   * Create a simple tray icon (fallback)
   */
  private createTrayIcon(): Electron.NativeImage {
    // Create a simple 16x16 icon programmatically
    const canvas = Buffer.alloc(16 * 16 * 4); // 16x16 RGBA
    
    // Fill with a simple pattern
    for (let i = 0; i < canvas.length; i += 4) {
      canvas[i] = 70;     // R
      canvas[i + 1] = 130; // G
      canvas[i + 2] = 180; // B
      canvas[i + 3] = 255; // A
    }

    return nativeImage.createFromBuffer(canvas, { width: 16, height: 16 });
  }
}