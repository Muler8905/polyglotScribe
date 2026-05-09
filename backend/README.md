# Polyglot Scribe Backend API

Node.js + Express + Prisma + MySQL backend for Polyglot Scribe application.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 📋 Requirements

- Node.js 18+ or 20+
- MySQL 8+ (local)
- Gmail account (for email OTP)

## 🔧 Configuration

See `.env.example` for all configuration options.

### Required Environment Variables:
- `DATABASE_URL` - MySQL connection string for Prisma
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `EMAIL_USER` - Gmail address
- `EMAIL_PASSWORD` - Gmail app password
- `FRONTEND_URL` - Frontend application URL

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP email
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)

## 🧪 Testing

### Test Health Endpoint:
```bash
curl http://localhost:5000/health
```

### Test Signup:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'
```

## 📦 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API routes
├── utils/           # Utility functions
└── server.js        # Main server file
```

Prisma:

```
prisma/
├── schema.prisma
└── seed.js
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT authentication
- HTTP-only cookies
- CORS protection
- Rate limiting
- Helmet security headers
- Input validation
- Email verification
- Secure password reset

## 📝 License

MIT
