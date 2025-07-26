import { safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { AuthTokens } from '../types/auth';

export class TokenStorageService {
  private readonly STORAGE_FILE = 'auth_tokens.enc';
  private readonly storagePath: string;

  constructor() {
    // Store tokens in app's user data directory
    const userDataPath = app.getPath('userData');
    this.storagePath = path.join(userDataPath, this.STORAGE_FILE);
  }

  /**
   * Store tokens securely using Electron's safeStorage or fallback to file storage
   */
  async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      const tokenData = JSON.stringify(tokens);
      
      if (safeStorage.isEncryptionAvailable()) {
        // Use encrypted storage when available
        const encryptedData = safeStorage.encryptString(tokenData);
        await fs.promises.writeFile(this.storagePath, encryptedData);
        console.log('✅ Tokens stored securely with encryption');
      } else {
        // Fallback to plain file storage for development (with warning)
        console.warn('⚠️ Encryption not available, using plain text storage (development only)');
        const fallbackPath = this.storagePath.replace('.enc', '.json');
        await fs.promises.writeFile(fallbackPath, tokenData, { mode: 0o600 }); // Restrict file permissions
        console.log('✅ Tokens stored in development mode');
      }
    } catch (error) {
      throw new Error(`Failed to store tokens: ${error}`);
    }
  }

  /**
   * Retrieve and decrypt stored tokens
   */
  async getTokens(): Promise<AuthTokens | null> {
    try {
      const fallbackPath = this.storagePath.replace('.enc', '.json');
      
      if (safeStorage.isEncryptionAvailable() && fs.existsSync(this.storagePath)) {
        // Try encrypted storage first
        const encryptedData = await fs.promises.readFile(this.storagePath);
        const decryptedData = safeStorage.decryptString(encryptedData);
        return JSON.parse(decryptedData) as AuthTokens;
      } else if (fs.existsSync(fallbackPath)) {
        // Try fallback plain text storage
        console.warn('⚠️ Reading tokens from development storage');
        const tokenData = await fs.promises.readFile(fallbackPath, 'utf8');
        return JSON.parse(tokenData) as AuthTokens;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      // If we can't decrypt, remove the corrupted files
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Remove stored tokens
   */
  async clearTokens(): Promise<void> {
    try {
      const fallbackPath = this.storagePath.replace('.enc', '.json');
      
      if (fs.existsSync(this.storagePath)) {
        await fs.promises.unlink(this.storagePath);
      }
      if (fs.existsSync(fallbackPath)) {
        await fs.promises.unlink(fallbackPath);
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Check if tokens exist
   */
  hasStoredTokens(): boolean {
    const fallbackPath = this.storagePath.replace('.enc', '.json');
    return fs.existsSync(this.storagePath) || fs.existsSync(fallbackPath);
  }

  /**
   * Update stored tokens (useful for refresh token updates)
   */
  async updateTokens(tokens: AuthTokens): Promise<void> {
    await this.storeTokens(tokens);
  }
}