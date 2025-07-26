# CalDesk - Google Calendar Desktop Widget

A beautiful, modern desktop widget for Google Calendar built with Electron, React, and TypeScript. CalDesk stays on your desktop to provide quick access to your calendar events without opening a browser.

![CalDesk Screenshot](docs/images/screenshot.png)

## Features

### ✨ Phase 1 - Foundation (Completed)
- **Desktop Widget**: Stays on desktop layer, behind applications but above wallpaper
- **Modern UI**: Glassmorphism design with smooth animations using Framer Motion
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Dark/Light Theme**: Automatic theme detection based on system preferences
- **Frameless Window**: Clean, borderless interface that blends with your desktop

### 🔐 Phase 2 - Authentication & Calendar (Completed)
- **Secure OAuth**: Google OAuth 2.0 authentication with popup flow
- **Token Management**: Secure token storage using Electron's safeStorage API
- **Auto-refresh**: Automatic token refresh when expired
- **Real Calendar Data**: Live integration with Google Calendar API
- **Today's Events**: Quick view of today's events with time and location
- **Calendar Navigation**: Month view with event indicators

### 🚀 Phase 3 - Event Management (Coming Soon)
- Create, edit, and delete calendar events
- Drag-and-drop event rescheduling
- Quick-add event forms
- Event detail views

### 🎨 Phase 4 - Advanced Features (Coming Soon)
- Multiple calendar support
- Custom themes and transparency controls
- Desktop notifications
- Widget size presets

## Installation

### Prerequisites
- Node.js (v18 or higher)
- Google Cloud Console account for OAuth credentials

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/sylergy-zubair/caldesk.git
   cd caldesk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google OAuth credentials**
   - Follow the [Google OAuth Setup Guide](docs/development/google-oauth-setup.md)
   - Copy `.env.example` to `.env` and add your credentials:
     ```env
     GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Development

### Project Structure
```
caldesk/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script for IPC
│   ├── services/            # Backend services
│   │   ├── googleAuth.ts    # Google OAuth service
│   │   ├── googleCalendar.ts # Google Calendar API
│   │   └── tokenStorage.ts  # Secure token storage
│   ├── types/               # TypeScript type definitions
│   └── renderer/            # Frontend React app
│       ├── components/      # React components
│       ├── hooks/           # Custom React hooks
│       └── styles/          # CSS and styling
├── docs/                    # Documentation
└── dist/                    # Built application
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start the built application
- `npm run build:main` - Build only the Electron main process
- `npm run build:renderer` - Build only the React frontend

### Architecture

**Desktop Widget Configuration**
- Frameless, transparent Electron window
- Positioned on desktop layer using platform-specific APIs
- Draggable with position persistence
- Auto-theme detection and smooth transitions

**Security**
- OAuth tokens encrypted using Electron's safeStorage
- No sensitive data stored in plain text
- Automatic token refresh with error handling
- Secure IPC communication between processes

**Modern UI Stack**
- React 19 with TypeScript for type safety
- Tailwind CSS for utility-first styling
- Framer Motion for smooth animations
- Glassmorphism design with backdrop blur

## Documentation

- [Phase Development Plan](docs/development/phased-plan.md)
- [Google OAuth Setup Guide](docs/development/google-oauth-setup.md)
- [Contributing Guidelines](CONTRIBUTING.md) *(coming soon)*

## Commit Standards

This project follows conventional commit standards:

- `feat:` New features
- `fix:` Bug fixes  
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

Example: `feat(auth): add Google OAuth integration`

## Troubleshooting

### Common Issues

**OAuth Authentication Fails**
- Verify Google Cloud Console setup is complete
- Check that redirect URI `http://localhost:8080/callback` is configured
- Ensure `.env` file contains correct credentials

**Calendar Data Not Loading**
- Check Google Calendar API is enabled in Google Cloud Console
- Verify OAuth scopes include calendar access
- Check network connectivity and API quotas

**Desktop Widget Not Staying on Desktop**
- Platform-specific behavior may vary
- Check if other desktop widgets work on your system
- Try restarting the application

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Electron](https://electronjs.org/)
- UI powered by [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Google Calendar integration via [Google APIs](https://developers.google.com/calendar)

---

**Phase 2 Complete! 🎉**

CalDesk now features secure Google Calendar authentication and real-time calendar data integration. The desktop widget displays your today's events and provides a beautiful calendar interface with modern glassmorphism design.