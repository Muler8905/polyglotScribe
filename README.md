# 🎙️ Polyglot Scribe

**Polyglot Scribe** is a powerful, full-stack multilingual transcription and translation platform. It enables real-time speech-to-text, audio file transcription, and YouTube video processing with instant translation into multiple languages, including Amharic, Afaan Oromo, Somali, and English.

![Polyglot Scribe](https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=1000)

## 🚀 Features

### 🎙️ Advanced Transcription
- **Live Transcription**: Real-time speech-to-text directly from your microphone.
- **File Transcription**: Upload audio files (MP3, WAV, M4A) for fast processing.
- **YouTube Transcription**: Extract and transcribe audio from any YouTube URL.

### 🌍 Multilingual Translation
- Instant translation of transcripts into:
  - **Amharic** (አማርኛ)
  - **Afaan Oromo** (Oromiffa)
  - **Somali** (Soomaali)
  - **English**

### 🔐 Secure Authentication
- **Multi-factor Auth**: Secure sign-up/sign-in with OTP email verification.
- **Social Login**: Integrated Google OAuth support.
- **Session Management**: Secure JWT-based authentication.

### 🛠️ Admin Dashboard
- **User Management**: Monitor users, update credits, and manage roles.
- **System Control**: Manage hero images and core platform settings.
- **Analytics**: High-level overview of system usage.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19
- **Routing**: TanStack Router & TanStack Start
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS 4 & Framer Motion
- **UI Components**: Radix UI
- **Internationalization**: i18next

### Backend
- **Runtime**: Node.js & Express
- **Database**: MongoDB Atlas with Mongoose
- **Security**: JWT, Bcrypt, Helmet, Express Rate Limit
- **Communication**: Nodemailer (SMTP)

### External APIs
- **Transcription**: ElevenLabs API
- **Translation**: Lovable API

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- ElevenLabs & Lovable API Keys

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Muler8905/polyglotScribe.git
   cd polyglotScribe
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   FRONTEND_URL=http://localhost:8080
   ```

3. **Setup Frontend**
   ```bash
   cd ..
   npm install
   ```
   Create a `.env` file in the root folder:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ELEVENLABS_API_KEY=your_elevenlabs_key
   LOVABLE_API_KEY=your_lovable_key
   ```

### Running the App

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Development Server**
   ```bash
   cd ..
   npm run dev
   ```

3. Open your browser to `http://localhost:8080`

---

## 📊 System Architecture

```mermaid
graph TD
    A[Frontend - React/TanStack] -->|REST API| B[Backend - Express/Node.js]
    B --> C[(MongoDB Atlas)]
    B --> D[Gmail SMTP]
    A --> E[ElevenLabs API - Transcription]
    A --> F[Lovable API - Translation]
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Muler8905**
- GitHub: [@Muler8905](https://github.com/Muler8905)

---
*Developed with ❤️ for the multilingual community.*
