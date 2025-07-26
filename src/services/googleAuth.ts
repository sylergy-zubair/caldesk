import { google } from 'googleapis';
import { BrowserWindow } from 'electron';
import { AuthTokens, GoogleUser } from '../types/auth';

export class GoogleAuthService {
  private oauth2Client: any;
  private readonly CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  private readonly REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  constructor() {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    }

    this.oauth2Client = new google.auth.OAuth2(
      this.CLIENT_ID,
      this.CLIENT_SECRET,
      this.REDIRECT_URI
    );
  }

  /**
   * Start the OAuth flow by opening a popup window
   */
  async authenticate(): Promise<AuthTokens> {
    return new Promise((resolve, reject) => {
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.SCOPES,
        prompt: 'consent', // Force consent to get refresh token
      });

      // Track if authentication completed
      let authCompleted = false;

      // Create a new window for authentication
      const authWindow = new BrowserWindow({
        width: 500,
        height: 600,
        show: true,
        modal: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      authWindow.loadURL(authUrl);

      // Extract authorization code from URL or page content
      const extractCodeFromPage = async (): Promise<string | null> => {
        try {
          // Get current URL which might contain the authorization code
          const currentUrl = authWindow.webContents.getURL();
          console.log('🔍 Checking URL for auth code:', currentUrl);
          
          // Check URL parameters for authorization code
          const url = new URL(currentUrl);
          
          // Check for approvalCode parameter (direct code)
          const approvalCode = url.searchParams.get('approvalCode');
          if (approvalCode && approvalCode.startsWith('4/1')) {
            console.log('✅ Found approval code in URL params:', approvalCode);
            return approvalCode;
          }
          
          // Check for code parameter in response (URL encoded)
          const responseParam = url.searchParams.get('response');
          if (responseParam) {
            const codeMatch = responseParam.match(/code%3D([^%&]+)/);
            if (codeMatch) {
              const decodedCode = decodeURIComponent(codeMatch[1]);
              console.log('✅ Found code in response parameter:', decodedCode);
              return decodedCode;
            }
          }
          
          // Check for direct code parameter
          const codeParam = url.searchParams.get('code');
          if (codeParam && codeParam.startsWith('4/1')) {
            console.log('✅ Found code in URL code param:', codeParam);
            return codeParam;
          }
          
          // Fallback: Try to extract from page content (for older OAuth flows)
          try {
            const pageContent = await authWindow.webContents.executeJavaScript(`
              (function() {
                try {
                  return {
                    content: document.body.innerText || document.body.textContent || '',
                    url: window.location.href
                  };
                } catch (e) {
                  return { content: '', url: window.location.href };
                }
              })()
            `);
            
            console.log('📄 Page content preview:', pageContent.content.substring(0, 200));
            
            // Look for authorization code patterns in page content
            const patterns = [
              /4\/1[A-Za-z0-9_-]{40,}/,
              /paste it there:\s*([4\/1][A-Za-z0-9_-]{40,})/i,
              /Authorisation code[\s\S]*?([4\/1][A-Za-z0-9_-]{40,})/i,
            ];
            
            for (const pattern of patterns) {
              const match = pageContent.content.match(pattern);
              if (match) {
                const code = match[1] || match[0];
                console.log('✅ Found code in page content:', code);
                return code.trim();
              }
            }
          } catch (pageError) {
            console.log('ℹ️ Could not extract from page content, continuing with URL parsing only');
          }
          
          console.log('❌ No authorization code found');
          return null;
        } catch (error) {
          console.error('❌ Error extracting code:', error);
          return null;
        }
      };

      // Handle successful authentication
      const handleAuthSuccess = async (code: string) => {
        if (authCompleted) return; // Prevent duplicate processing
        
        authCompleted = true;
        authWindow.close();
        
        try {
          console.log('🔄 Exchanging code for tokens...');
          const { tokens } = await this.oauth2Client.getToken(code);
          this.oauth2Client.setCredentials(tokens);
          
          const authTokens: AuthTokens = {
            access_token: tokens.access_token!,
            refresh_token: tokens.refresh_token!,
            scope: tokens.scope!,
            token_type: tokens.token_type!,
            expires_at: tokens.expiry_date!,
          };

          console.log('✅ Authentication successful!');
          resolve(authTokens);
        } catch (tokenError) {
          console.error('❌ Token exchange failed:', tokenError);
          reject(new Error(`Failed to exchange code for tokens: ${tokenError}`));
        }
      };

      // Handle page navigation
      authWindow.webContents.on('did-navigate', async (event, url) => {
        console.log('🌐 Navigation detected:', url);
        
        // Check for any Google OAuth related page
        if (url.includes('google.com')) {
          console.log('🎯 Detected Google page, waiting for content...');
          
          // Wait for page to load and then extract code
          setTimeout(async () => {
            const code = await extractCodeFromPage();
            if (code) {
              await handleAuthSuccess(code);
            }
          }, 4000); // Wait 4 seconds for content to load
        }
      });

      // Also listen for page load completion
      authWindow.webContents.on('did-finish-load', async () => {
        const currentUrl = authWindow.webContents.getURL();
        console.log('📄 Page finished loading:', currentUrl);
        
        if (currentUrl.includes('google.com') && !authCompleted) {
          // Wait a bit more for dynamic content to load
          setTimeout(async () => {
            const code = await extractCodeFromPage();
            if (code) {
              await handleAuthSuccess(code);
            }
          }, 2000);
        }
      });

      
      // Handle window closed without completing auth
      authWindow.on('closed', () => {
        if (!authCompleted) {
          reject(new Error('Authentication window was closed'));
        }
      });
      
      // Prevent premature window closing
      authWindow.on('close', (event) => {
        if (!authCompleted) {
          console.log('Preventing window close - auth not completed yet');
          // Don't prevent close yet, but add logging
        }
      });
    });
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token ?? refreshToken, // Keep existing refresh token if new one not provided
        scope: credentials.scope!,
        token_type: credentials.token_type!,
        expires_at: credentials.expiry_date!,
      };
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error}`);
    }
  }

  /**
   * Get user information using the access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUser> {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    });

    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      return {
        id: data.id!,
        email: data.email!,
        name: data.name!,
        picture: data.picture || undefined,
      };
    } catch (error) {
      throw new Error(`Failed to get user info: ${error}`);
    }
  }

  /**
   * Revoke the access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
    } catch (error) {
      throw new Error(`Failed to revoke token: ${error}`);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt - 60000; // Consider expired 1 minute before actual expiry
  }

  /**
   * Get authenticated OAuth2 client for API calls
   */
  getAuthenticatedClient(tokens: AuthTokens): any {
    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expires_at,
    });

    return this.oauth2Client;
  }
}