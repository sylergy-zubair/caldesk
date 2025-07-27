import { app } from 'electron';

export class AutoStartManager {
  /**
   * Enable auto-start on system boot
   */
  static enable(): void {
    if (process.platform === 'darwin') {
      // macOS
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true,
        args: ['--hidden'],
      });
    } else if (process.platform === 'win32') {
      // Windows
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true,
        args: ['--hidden'],
      });
    } else {
      // Linux - would need additional implementation for different desktop environments
      console.log('Auto-start setup for Linux requires manual configuration');
    }
  }

  /**
   * Disable auto-start
   */
  static disable(): void {
    app.setLoginItemSettings({
      openAtLogin: false,
    });
  }

  /**
   * Check if auto-start is enabled
   */
  static isEnabled(): boolean {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  }

  /**
   * Toggle auto-start
   */
  static toggle(): boolean {
    const isCurrentlyEnabled = this.isEnabled();
    if (isCurrentlyEnabled) {
      this.disable();
    } else {
      this.enable();
    }
    return !isCurrentlyEnabled;
  }

  /**
   * Initialize auto-start based on user preference
   */
  static initialize(): void {
    // Check if the app was started with --hidden flag
    const isHiddenStart = process.argv.includes('--hidden');
    
    if (isHiddenStart) {
      console.log('App started in hidden mode (auto-start)');
      // Window will be created but hidden by default
    } else {
      console.log('App started normally');
    }
  }
}