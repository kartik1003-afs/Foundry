# Foundry Backend Server

Firebase-powered backend for the Foundry campus lost and found application.

## Setup Instructions

### 1. Firebase Project Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password and Google Sign-In
3. Enable Firestore Database:
   - Go to Firestore Database → Create database
   - Choose test mode for now (security rules can be added later)
4. Enable Storage:
   - Go to Storage → Get started
   - Choose test mode for now

### 2. Service Account Setup

1. Go to Firebase Project Settings → Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the credentials to your `.env` file

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Update the `.env` file with your Firebase project details:
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: From service account JSON
- `FIREBASE_PRIVATE_KEY`: From service account JSON (with proper line breaks)
- `FIREBASE_DATABASE_URL`: Your Firestore database URL
- `FIREBASE_STORAGE_BUCKET`: Your Storage bucket name

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will run on port 5000 by default.

## API Endpoints

### Authentication
- `POST /api/auth/create-user` - Create user document in Firestore
- `GET /api/auth/user/:uid` - Get user profile

### Items (Lost & Found)
- `POST /api/items/lost` - Create lost item (auth required)
- `POST /api/items/found` - Create found item (auth required)
- `GET /api/items/discover` - Get all items (public, with filters)
- `GET /api/items/lost/user/:uid` - Get user's lost items (auth required)
- `GET /api/items/found/user/:uid` - Get user's found items (auth required)

### Health Check
- `GET /health` - Server health check

## Authentication

All protected endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Firestore Collections

- `users` - User profiles
- `lost_items` - Lost item reports
- `found_items` - Found item reports
- `matches` - Item matches (future feature)

## Security Notes

- Only authenticated users can create items
- Users can only modify/view their own items
- Anyone can view items for discovery
- Firebase Security Rules should be configured for production
