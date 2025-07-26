export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expires_at: number;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
}