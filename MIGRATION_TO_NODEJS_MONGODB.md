# Migration Guide: Supabase → Node.js + Express + MongoDB

## 🎯 Overview

This guide will help you migrate from Supabase to a custom Node.js/Express/MongoDB backend.

---

## 📦 What's Been Created

### Backend Structure:
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── email.js             # Email service (Nodemailer)
│   ├── controllers/
│   │   └── authController.js    # Authentication logic
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   └── validate.js          # Request validation
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Profile.js           # Profile model
│   │   └── Transcription.js     # Transcription model
│   ├── routes/
│   │   └── authRoutes.js        # Auth API routes
│   ├── utils/
│   │   └── jwt.js               # JWT utilities
│   └── server.js                # Main server file
├── .env.example                 # Environment variables template
├── .gitignore
└── package.json

Frontend:
├── src/
│   └── lib/
│       └── api-client.ts        # API client (replaces Supabase)
```

---

## 🚀 Setup Instructions

### Step 1: Install MongoDB

#### Option A: Local MongoDB (Development)

**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. MongoDB will run on `mongodb://localhost:27017`

**Mac (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### Option B: MongoDB Atlas (Cloud - Recommended)

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a new cluster (Free tier: M0)
4. Wait for cluster to be created (~5 minutes)
5. Click "Connect"
6. Add your IP address (or allow from anywhere: 0.0.0.0/0)
7. Create database user (username + password)
8. Choose "Connect your application"
9. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/polyglot-scribe?retryWrites=true&w=majority
   ```

---

### Step 2: Setup Backend

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file:**
   ```env
   PORT=5000
   NODE_ENV=development

   # MongoDB - Use one of these:
   # Local:
   MONGODB_URI=mongodb://localhost:27017/polyglot-scribe
   # Or Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/polyglot-scribe

   # JWT Secrets (generate random strings)
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d

   # Email (Gmail SMTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   EMAIL_FROM=Polyglot Scribe <noreply@polyglotscribe.com>

   # Frontend URL
   FRONTEND_URL=http://localhost:8080

   # OTP Settings
   OTP_EXPIRE_MINUTES=60
   OTP_LENGTH=6
   ```

5. **Generate JWT secrets:**
   ```bash
   # In Node.js console or terminal:
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copy the output and use it for JWT_SECRET and JWT_REFRESH_SECRET

6. **Start the backend server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ✅ MongoDB Connected: localhost
   🚀 Server running in development mode on port 5000
   📡 Frontend URL: http://localhost:8080
   ```

---

### Step 3: Update Frontend

1. **Add API URL to frontend `.env`:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

2. **Update `src/lib/auth-context.tsx`:**

   Replace the Supabase imports and logic with the new API client.
   
   I'll create a new auth context file for you in the next step.

---

### Step 4: Test the Backend

**Test health endpoint:**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-05-08T..."
}
```

**Test signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'
```

---

## 🔄 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/verify-otp` | Verify email with OTP | No |
| POST | `/api/auth/resend-otp` | Resend OTP email | No |
| POST | `/api/auth/signin` | Sign in user | No |
| POST | `/api/auth/signout` | Sign out user | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |

---

## 📝 Frontend Integration

### Using the API Client

```typescript
import { apiClient } from '@/lib/api-client';

// Sign up
const result = await apiClient.signup(email, password, displayName);

// Verify OTP
const verified = await apiClient.verifyOTP(email, otp);

// Sign in
const signedIn = await apiClient.signin(email, password);

// Get current user
const user = await apiClient.getMe();

// Sign out
await apiClient.signout();

// Check if authenticated
const isAuth = apiClient.isAuthenticated();
```

---

## 🔐 Security Features

### Implemented:
- ✅ Password hashing with bcrypt
- ✅ JWT access tokens (7 days)
- ✅ JWT refresh tokens (30 days)
- ✅ HTTP-only cookies
- ✅ CORS protection
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Email verification with OTP
- ✅ Password reset with secure tokens
- ✅ Token refresh mechanism

---

## 📧 Email Configuration

### Gmail Setup (Same as before):

1. Enable 2-Step Verification
2. Generate App Password
3. Add to `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

---

## 🗄️ Database Schema

### Users Collection:
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  displayName: String,
  avatarUrl: String,
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  googleId: String (optional),
  provider: 'local' | 'google',
  refreshTokens: [{ token, createdAt, expiresAt }],
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Profiles Collection:
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  displayName: String,
  avatarUrl: String,
  bio: String,
  preferences: {
    language: String,
    theme: String,
    notifications: { email, push }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Transcriptions Collection:
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: 'live' | 'file' | 'youtube',
  title: String,
  sourceUrl: String,
  sourceLang: String,
  targetLang: String,
  transcript: String,
  translation: String,
  durationSeconds: Number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing

### Manual Testing:

1. **Sign Up:**
   - Go to `/auth`
   - Fill in email, password, name
   - Click "Sign Up"
   - Check email for OTP
   - Enter OTP
   - Should be signed in

2. **Sign In:**
   - Go to `/auth`
   - Enter email and password
   - Click "Sign In"
   - Should redirect to dashboard

3. **Forgot Password:**
   - Click "Forgot password?"
   - Enter email
   - Check email for reset link
   - Click link
   - Enter new password
   - Should be able to sign in

---

## 🚀 Deployment

### Backend Deployment (Heroku):

1. Create Heroku app:
   ```bash
   heroku create polyglot-scribe-api
   ```

2. Add MongoDB Atlas connection string:
   ```bash
   heroku config:set MONGODB_URI="mongodb+srv://..."
   ```

3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET="..."
   heroku config:set FRONTEND_URL="https://your-frontend.com"
   ```

4. Deploy:
   ```bash
   git subtree push --prefix backend heroku main
   ```

### Alternative: Railway, Render, DigitalOcean

---

## 📊 Monitoring

### Check Logs:
```bash
# Backend logs
cd backend
npm run dev

# MongoDB logs (if local)
tail -f /usr/local/var/log/mongodb/mongo.log
```

### MongoDB Compass (GUI):
1. Download: https://www.mongodb.com/products/compass
2. Connect to your database
3. View collections, documents, indexes

---

## 🔄 Migration Checklist

- [ ] MongoDB installed and running
- [ ] Backend dependencies installed
- [ ] `.env` file configured
- [ ] JWT secrets generated
- [ ] Email SMTP configured
- [ ] Backend server starts successfully
- [ ] Frontend API URL configured
- [ ] Test signup flow
- [ ] Test OTP verification
- [ ] Test signin flow
- [ ] Test forgot password
- [ ] Test password reset
- [ ] All features working

---

## 🆘 Troubleshooting

### Backend won't start:
- Check MongoDB is running
- Verify `.env` file exists and is configured
- Check port 5000 is not in use

### Can't connect to MongoDB:
- Local: Ensure MongoDB service is running
- Atlas: Check IP whitelist and credentials

### Emails not sending:
- Verify Gmail app password
- Check email credentials in `.env`
- Look for errors in backend logs

### CORS errors:
- Verify `FRONTEND_URL` in backend `.env`
- Check frontend is running on correct port

---

## ✅ Benefits of This Migration

1. **Full Control:** Complete control over your backend
2. **No Vendor Lock-in:** Not tied to Supabase
3. **Customizable:** Easy to add custom features
4. **Cost-Effective:** MongoDB Atlas free tier is generous
5. **Scalable:** Can scale independently
6. **Learning:** Better understanding of backend architecture

---

## 📚 Next Steps

1. Complete the migration
2. Test all features thoroughly
3. Add more API endpoints as needed
4. Implement Google OAuth (if needed)
5. Add transcription endpoints
6. Deploy to production

---

## 🎯 Summary

You now have a complete Node.js/Express/MongoDB backend that replaces Supabase with:
- ✅ User authentication (signup, signin, signout)
- ✅ Email verification with 6-digit OTP
- ✅ Password reset functionality
- ✅ JWT token management
- ✅ Secure API endpoints
- ✅ Email service integration
- ✅ MongoDB database
- ✅ Production-ready architecture

**Time to complete:** 30-60 minutes
**Difficulty:** Intermediate
**Result:** Full-stack application with custom backend!
