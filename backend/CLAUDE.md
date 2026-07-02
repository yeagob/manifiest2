# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Protest Simulator Backend - A Node.js/Express API for tracking steps allocated to social causes. Users walk for causes they support, with steps distributed according to user-configured intervals.

## Development Commands

### Core Commands
```bash
npm run dev         # Start development server with nodemon (auto-reload)
npm start           # Start production server
npm test            # Run Jest tests with ES modules support
```

### Before First Run
```bash
npm install         # Install dependencies
cp .env.example .env  # Create environment config
# Edit .env with actual credentials
```

## Architecture

### Data Persistence Strategy
This project uses **file-based JSON storage** instead of a traditional database. Each entity type (users, causes, steps, messages) is stored as individual JSON files in `data/[collection]/[id].json`.

**Key Points:**
- `StorageService` (src/services/storage.js) provides generic CRUD operations
- Each model class extends StorageService functionality with domain logic
- Data directories are auto-created on server startup (src/index.js:72-84)
- All reads/writes are async file operations using Node's fs/promises
- No migrations needed; schema changes handled in model constructors

### Authentication Flow
Dual authentication system supporting both JWT tokens and sessions:

1. **JWT-based (primary):** Used for cross-origin requests
   - Login via `/api/auth/email` or `/api/auth/google` returns JWT token
   - Frontend sends token in `Authorization: Bearer [token]` header
   - Tokens expire in 7 days (configurable in src/middleware/auth.js:8)

2. **Session-based (fallback):** For backwards compatibility
   - Session cookie set on login
   - `requireAuth` middleware (src/middleware/auth.js:19) checks JWT first, then session

**Important:** Google OAuth requires valid `GOOGLE_CLIENT_ID` in .env. Email auth uses simple email-only validation (no password) for MVP purposes.

### Step Distribution System
The core business logic centers on distributing steps to causes:

**User Model (src/models/User.js):**
- `stepDistribution` object maps causeId to `{interval, count}`
- Interval determines frequency: every N steps goes to this cause
- Example: interval=2 means every 2nd step goes to this cause

**Step Recording Flow:**
1. POST to `/api/steps` with step count
2. Backend iterates through user's `stepDistribution`
3. Steps allocated based on each cause's interval
4. Both User.totalSteps and Cause.totalSteps updated atomically

**Cause Model (src/models/Cause.js):**
- `supporters` array tracks user IDs
- `totalSteps` aggregates all contributions
- Static methods like `getMostActive()` for leaderboards

### AI Integration (Optional)
`AIService` (src/services/aiService.js) uses Google Gemini to detect duplicate causes:

- Triggered when creating new causes (POST /api/causes/check-similar)
- Compares semantic similarity between proposed and existing causes
- Returns matched cause suggestions to prevent fragmentation
- **Graceful degradation:** Works without GEMINI_API_KEY (just disables feature)

**Architecture Note:** Singleton pattern with lazy initialization. Check `enabled` flag before using AI features.

### Route Organization
All routes follow `/api/[resource]` pattern:

- `/api/auth` - Authentication (login, logout, session management)
- `/api/users` - User CRUD and avatar updates
- `/api/causes` - Cause management and similarity checks
- `/api/steps` - Step recording and history
- `/api/messages` - User-to-cause messaging/comments
- `/api/ai` - AI-powered cause analysis

Each route file is self-contained with its own Express router.

## Configuration

### Required Environment Variables
```
GOOGLE_CLIENT_ID      # For Google OAuth (can skip if using email auth only)
GOOGLE_CLIENT_SECRET  # For Google OAuth
JWT_SECRET            # JWT signing key (CHANGE IN PRODUCTION)
SESSION_SECRET        # Express session secret
FRONTEND_URL          # CORS allowed origin (production frontend)
```

### Optional Environment Variables
```
GEMINI_API_KEY        # Enables AI similarity detection
PORT                  # Server port (default: 3001)
NODE_ENV              # development|production (affects CORS, cookies)
COOKIE_DOMAIN         # For cross-domain cookies in production
DATA_PATH             # Override data storage location (default: ./data)
```

## Common Patterns

### Adding a New Model
1. Create class extending with `StorageService` instantiation
2. Define schema in constructor with defaults
3. Implement `save()`, `toJSON()`, and static `findById()`, `findAll()`, `create()`
4. Add corresponding directory name to `initDataDirs()` in src/index.js:75

### Adding a New Route
1. Create route file in src/routes/[name].js
2. Import and mount in src/index.js (around line 87)
3. Use `requireAuth` middleware for protected endpoints
4. Return JSON responses with proper HTTP status codes

### Error Handling
- Route-level try/catch blocks return specific error messages
- Global error handler (src/index.js:100) catches unhandled errors
- In development, full error messages exposed; in production, generic messages

## Testing

Tests use Jest with ES modules support (see package.json:10):
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

Example test: src/models/Cause.test.js demonstrates model testing patterns.

## CORS Configuration

Production CORS setup (src/index.js:34-56):
- Whitelist approach with specific origins
- Credentials enabled for cross-origin cookies/tokens
- Normalizes trailing slashes to prevent mismatches
- Logs blocked origins for debugging

Add production domains to `allowedOrigins` array or use `FRONTEND_URL` env var.
