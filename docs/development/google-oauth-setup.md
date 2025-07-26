# Google OAuth Setup Guide

## Overview

CalDesk uses Google OAuth 2.0 to securely authenticate users and access their Google Calendar data. This guide walks you through setting up the required credentials.

## Prerequisites

- Google Account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Quick Setup Checklist

Before starting, make sure you have:
- [ ] Google Account
- [ ] Access to [Google Cloud Console](https://console.cloud.google.com/)

**Complete setup order:**
1. [ ] Create Google Cloud Project
2. [ ] Enable required APIs (Calendar + Google+)
3. [ ] Configure OAuth consent screen (all 4 steps)
4. [ ] Create OAuth 2.0 credentials
5. [ ] Set up environment variables

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `CalDesk` (or your preferred name)
5. Click "Create"

### 2. Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - **Google Calendar API**
   - **Google+ API** (for user profile information)

### 3. Configure OAuth Consent Screen

**If you see "Google auth platform not configured yet":**
This is normal for new projects. Follow these steps:

1. Go to "APIs & Services" > "OAuth consent screen"
2. You'll see a setup wizard. Choose **"External"** for user type
   - Choose "External" even for personal projects (unless you have a Google Workspace account)
   - Click "Create"

3. **App Information** (Step 1):
   - **App name**: `CalDesk`
   - **User support email**: Select your email from dropdown
   - **App logo**: (Optional) Skip for now
   - **App domain**: (Optional) Skip for now
   - **Developer contact information**: Enter your email
   - Click "Save and Continue"

4. **Scopes** (Step 2):
   - Click "Add or Remove Scopes"
   - Search for and select these scopes:
     - `../auth/calendar` (Google Calendar API)
     - `../auth/userinfo.profile` (User profile info)
     - `../auth/userinfo.email` (User email)
   - Click "Update" then "Save and Continue"

5. **Test Users** (Step 3):
   - Click "Add Users"
   - Add your own email address
   - Click "Add" then "Save and Continue"

6. **Summary** (Step 4):
   - Review your settings
   - Click "Back to Dashboard"

### 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Set Application type to **"Desktop application"**
4. Enter name: `CalDesk Desktop`
5. Add Authorized redirect URIs:
   - `http://localhost:8080/callback`
6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

### 5. Configure Environment Variables

1. Copy `.env.example` to `.env` in your project root
2. Replace the placeholder values:

```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

## Security Best Practices

### Token Storage
- Tokens are encrypted using Electron's `safeStorage` API
- Stored in the user's system-specific secure storage
- Automatically cleared on logout

### Refresh Tokens
- Access tokens are automatically refreshed when expired
- Refresh tokens are securely stored and reused
- Manual token refresh available through the UI

### Scope Limitation
CalDesk only requests the minimum required permissions:
- `calendar`: Read/write access to Google Calendar
- `userinfo.profile`: User's basic profile information
- `userinfo.email`: User's email address

## Development Setup

### Environment Variables Loading
The application loads environment variables automatically. For development:

1. Create `.env` file with your credentials
2. The main Electron process will load these variables
3. OAuth service uses them to authenticate users

### Testing Authentication
1. Start the application: `npm run dev`
2. Click "Sign in with Google"
3. Complete OAuth flow in popup window
4. Verify calendar data loads correctly

## Troubleshooting

### Setup Issues

**"Google auth platform not configured yet"**
- This appears when OAuth consent screen isn't set up
- Follow the complete OAuth consent screen setup in Step 3 above
- Make sure to complete all 4 steps of the wizard
- Choose "External" user type for personal projects

**"App domain verification required"**
- For development, you can skip app domain verification
- Add your email as a test user to bypass verification requirements
- For production, you'll need to verify your domain

**"Project not found" or "Access denied to project"**
- Ensure you've created a Google Cloud project first
- Check that you're signed in with the correct Google account
- Verify you have admin access to the project

### OAuth Errors

**"OAuth Error: redirect_uri_mismatch"**
- Ensure `http://localhost:8080/callback` is added to authorized redirect URIs
- Check for typos in the redirect URI
- Verify the URI is saved correctly in Google Cloud Console

**"OAuth Error: invalid_client"**
- Verify Client ID and Client Secret are correct
- Ensure .env file is in the project root
- Check that environment variables are loading correctly
- Regenerate credentials if they appear corrupted

**"Calendar API not enabled"**
- Enable Google Calendar API in the Google Cloud Console
- Wait a few minutes for the API to be fully enabled
- Refresh the page and try again

**"Access denied" or "insufficient permissions"**
- Add your email as a test user in OAuth consent screen
- Ensure required scopes are configured correctly
- Check that Google Calendar API and Google+ API are both enabled

**"This app is blocked" or "Unverified app"**
- Click "Advanced" → "Go to CalDesk (unsafe)" during development
- This happens because the app isn't verified by Google yet
- For production, submit the app for verification

### Development Mode
For development, the app runs with:
- OAuth consent screen in "Testing" mode
- Only test users can authenticate
- Detailed error logging in console

### Production Setup
For production deployment:
- Submit OAuth consent screen for verification
- Remove testing limitations
- Add production redirect URIs if needed

## API Rate Limits

Google Calendar API has the following limits:
- 1,000,000 requests per day
- 100 requests per second per user

CalDesk implements:
- Intelligent caching to reduce API calls
- Automatic retry with exponential backoff
- Rate limit handling and user feedback

## Support

For issues with OAuth setup:
1. Check the [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
2. Verify all steps in this guide are completed
3. Check the application logs for detailed error messages