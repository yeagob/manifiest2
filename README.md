# ✊ Protest Simulator

A multiplayer online prototype that turns your daily steps into support for the causes you believe in. Walk for change, track your impact, and join a global movement of digital activists.

## 🌟 Features

### Core Functionality
- **Google OAuth Authentication**: Secure login with Google account (or demo mode for testing)
- **Cause Management**: Create, browse, and support causes you care about
- **Step Tracking**:
  - Automatic step detection using Device Motion API (mobile devices)
  - Manual step entry for importing from other trackers
  - Configurable step distribution across multiple causes
- **Real-time Statistics**: Track your impact with detailed charts and breakdowns
- **User Profiles**: View your personal stats, causes, and contribution history

### Step Distribution System
Configure how your steps are distributed to causes:
- Every step to a cause (interval: 1)
- Every 3 steps to a cause (interval: 3)
- Custom intervals for each supported cause

Example: Record 10 steps, and they automatically distribute based on your configured intervals!

## 🏗️ Architecture

### Backend (Node.js + Express)
- RESTful API with Express.js
- File-based JSON persistence (no database required for prototype)
- Session-based authentication
- Modular architecture with models, routes, and services

### Frontend (React + Vite)
- Modern React with hooks
- Zustand for state management
- React Router for navigation
- Recharts for data visualization
- Responsive design with custom CSS

### File Structure
```
manifiest2/
├── backend/
│   ├── src/
│   │   ├── models/        # Data models (Cause, User, Step)
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth middleware
│   │   └── index.js       # Server entry point
│   ├── data/              # JSON file storage
│   │   ├── causes/
│   │   ├── users/
│   │   └── steps/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client
│   │   ├── context/       # Zustand stores
│   │   ├── hooks/         # Custom hooks (step detector)
│   │   └── styles/        # CSS files
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser
- (Optional) Mobile device for automatic step detection

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd manifiest2

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_random_session_secret
FRONTEND_URL=http://localhost:5173
DATA_PATH=./data
```

#### Frontend (.env)
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Set Up Google OAuth (Optional)

For full Google login functionality:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173`
   - `http://localhost:3001`
6. Copy Client ID and Client Secret to your `.env` files

**Note**: For testing, you can use the "Demo Mode" button on the login page which doesn't require Google OAuth setup.

### 4. Run the Application

#### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3001

#### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

### 5. Access the Application

Open your browser and navigate to: http://localhost:5173

## 🧪 Testing the Application

### Using Demo Mode (No Google OAuth Required)

1. Open http://localhost:5173
2. Click "Try Demo Mode" button
3. You're logged in with a demo account!

### Testing Step Tracking

#### Manual Entry (Desktop)
1. Navigate to "Tracker" page
2. Enter number of steps (e.g., 100)
3. Click "Record Steps"
4. Steps are automatically distributed to your supported causes

#### Automatic Detection (Mobile)
1. Open the app on a mobile device
2. Navigate to "Tracker" page
3. Click "Start Tracking"
4. Grant motion sensor permissions if prompted
5. Walk around - steps will be detected!
6. Click "Stop & Record" to save

### Testing the Complete Flow

1. **Login**: Use Demo Mode or Google OAuth
2. **Browse Causes**: Navigate to "Causes" page
3. **Support a Cause**: Click "Support This Cause" on any cause
4. **Configure Distribution**: Set interval (e.g., every 3 steps)
5. **Create Your Own Cause**: Click "Create Cause"
   - Fill in title, description, category
   - Choose icon and color
   - Submit
6. **Track Steps**: Go to "Tracker"
   - Record steps manually or automatically
   - Watch them distribute across your causes
7. **View Stats**: Check "Profile" page
   - See total steps
   - View charts and breakdown
   - Track your impact

## 📊 API Endpoints

### Authentication
- `POST /api/auth/google` - Login with Google
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check auth status

### Causes
- `GET /api/causes` - Get all causes
- `GET /api/causes/most-active` - Get most active causes
- `GET /api/causes/:id` - Get single cause
- `POST /api/causes` - Create cause (auth required)
- `PUT /api/causes/:id` - Update cause (auth required)
- `DELETE /api/causes/:id` - Delete cause (auth required)
- `POST /api/causes/:id/support` - Support a cause (auth required)
- `POST /api/causes/:id/unsupport` - Unsupport a cause (auth required)
- `PUT /api/causes/:id/distribution` - Update step distribution (auth required)

### Steps
- `POST /api/steps` - Record steps (auth required)
- `GET /api/steps/history` - Get step history (auth required)
- `GET /api/steps/cause/:causeId` - Get steps for cause (auth required)
- `GET /api/steps/stats` - Get user stats (auth required)

### Users
- `GET /api/users/profile` - Get user profile (auth required)
- `PUT /api/users/profile` - Update profile (auth required)
- `GET /api/users/causes` - Get user's causes (auth required)

## 🧪 Running Tests

```bash
cd backend
npm test
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server with HMR
```

### Building for Production

#### Backend
```bash
cd backend
npm start  # Production mode
```

#### Frontend
```bash
cd frontend
npm run build  # Creates optimized build in dist/
npm run preview  # Preview production build
```

## 📱 Device Motion API Notes

The step detection feature uses the Device Motion API which has some limitations:

- **iOS**: Requires HTTPS in production and user permission
- **Android**: Works on most modern browsers
- **Desktop**: Limited/no support - use manual entry instead
- **Permissions**: Some devices require explicit user permission

If automatic detection doesn't work:
1. Use manual step entry
2. Import steps from your fitness tracker
3. Try a different browser/device

## 🔐 Security Notes

This is a **PROTOTYPE** application with the following considerations:

- Session-based authentication (suitable for prototype)
- File-based storage (not recommended for production)
- No rate limiting implemented
- No input sanitization beyond basic validation
- Google OAuth in development mode

For production deployment, consider:
- Database (PostgreSQL, MongoDB)
- JWT tokens with refresh mechanism
- Input validation and sanitization
- Rate limiting and DDoS protection
- HTTPS everywhere
- Proper secret management
- CORS configuration
- Security headers

## 🎨 Customization

### Adding New Cause Categories
Edit `frontend/src/pages/CreateCausePage.jsx`:
```javascript
const CATEGORIES = ['environment', 'human-rights', 'your-new-category', ...]
```

### Adding New Cause Icons
Edit the `CAUSE_ICONS` array in `CreateCausePage.jsx`

### Changing Theme Colors
Edit `frontend/src/styles/index.css` root variables

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### CORS Errors
Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL

### Step Detection Not Working
1. Check browser console for permission errors
2. Try on a mobile device
3. Use manual entry as fallback
4. Ensure HTTPS in production

### Data Not Persisting
Check that `backend/data/` directories exist and have write permissions

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This is a prototype project. Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

Created as a functional prototype for the Protest Simulator concept.

## 🙏 Acknowledgments

- React and Vite teams for excellent development tools
- Google for OAuth services
- The open-source community

---

**Note**: This is a prototype application designed to demonstrate the concept. For production use, additional security, scalability, and reliability measures should be implemented.