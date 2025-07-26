# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CalDesk is a Google Calendar desktop widget built with ElectronJS. This project is in the planning phase with the goal of creating a cross-platform desktop application that allows users to view, add, edit, and delete Google Calendar events through a native-like interface.

## Architecture

Based on the project plan, the application will follow this structure:

- **Main Process (Electron)**: Handles window management, OAuth flow, and secure token storage
- **Renderer Process**: UI layer using HTML/CSS/JavaScript (potentially with React, Vue, or plain JS)
- **Google Calendar Integration**: Uses `googleapis` Node.js client for API interactions
- **Authentication**: OAuth 2.0 flow with secure token storage using `keytar` or Electron's secure storage

## Key Components (Planned)

- **OAuth Manager**: Handles Google authentication and token refresh
- **Calendar Service**: Manages API calls to Google Calendar
- **Event Manager**: CRUD operations for calendar events
- **UI Components**: Calendar view, event forms, settings panel

## Development Setup

This project is currently in the planning phase. To initialize:

1. Install Node.js and npm/yarn
2. Initialize Electron project: `npm init` and `npm install --save-dev electron`
3. Set up main process in `main.js`
4. Create renderer process with `index.html`

## Key Dependencies (Planned)

- `electron` - Desktop app framework
- `googleapis` - Google Calendar API client
- `electron-google-oauth` or `electron-oauth-helper` - OAuth flow management
- `keytar` - Secure credential storage
- Optional: React/Vue/Svelte for UI framework

## Testing Requirements

- Every major feature must be tested automatically before implementation
- Write unit tests for all core functionality (OAuth, Calendar API integration, Event CRUD operations)
- Implement integration tests for Google Calendar API interactions
- Add end-to-end tests for critical user workflows (login, event creation, event editing)

## Commit Standards

- Use conventional commit format: `type(scope): description`
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep commit messages concise and descriptive
- Reference issues when applicable (e.g., "fixes #123")
- Use present tense ("add feature" not "added feature")
- Examples:
  - `feat(auth): add Google OAuth integration`
  - `fix(calendar): resolve event deletion error`
  - `test(oauth): add unit tests for token refresh`

## Documentation Standards

- All documentation should be placed in the `docs/` folder with appropriate sub-folders
- Organize documentation by feature/component:
  - `docs/api/` - API documentation and schemas
  - `docs/architecture/` - System design and architecture docs
  - `docs/development/` - Development guides and setup instructions
  - `docs/user/` - User guides and tutorials
  - `docs/testing/` - Testing strategies and test documentation
- Keep documentation up-to-date with code changes
- Use markdown format for all documentation files

## Command Shortcuts

- **"claude cc"**: When user types this command, Claude should:
  1. Review all staged and unstaged changes
  2. Create a commit with an appropriate message following the conventional commit standards above
  3. Push the changes to the remote repository

## Security Considerations

- Store OAuth tokens securely using Electron's secure storage or keytar
- Implement proper token refresh mechanisms
- Never expose API credentials in client-side code