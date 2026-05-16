# 🚀 Deployment Guide: Polyglot Scribe

This guide covers the steps required to deploy the Polyglot Scribe application to production using **Render** (Backend) and **Cloudflare Pages** (Frontend).

## 1. Backend Deployment (Render)

### Steps:
1.  **Create a New Web Service**:
    - Connect your GitHub repository.
    - Choose the `backend` directory as the Root Directory (or use the provided `render.yaml` blueprint).
    - Select **Node** as the runtime.
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
2.  **Environment Variables**:
    - `NODE_ENV`: `production`
    - `PORT`: `5000`
    - `MONGODB_URI`: Your MongoDB Atlas connection string.
    - `JWT_SECRET`: A long random string.
    - `JWT_REFRESH_SECRET`: Another long random string.
    - `FRONTEND_URL`: Your deployed frontend URL (e.g., `https://polyglotscribe.pages.dev`).
    - `API_BASE_URL`: Your deployed backend URL (e.g., `https://polyglot-scribe-backend.onrender.com`).
    - `CHAPA_SECRET_KEY`: Your production Chapa secret key.
    - `GOOGLE_CLIENT_ID`: From Google Cloud Console.
    - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
    - `GOOGLE_CALLBACK_URL`: `https://[YOUR_BACKEND_DOMAIN]/api/auth/google/callback`

---

## 2. Frontend Deployment (Cloudflare Pages)

### Steps:
1.  **Create a New Project**:
    - Connect your GitHub repository.
    - Choose the `frontend` directory.
    - **Framework Preset**: `None` (TanStack Start handles the build).
    - **Build Command**: `npm run build`
    - **Build Output Directory**: `.output/public` (or as specified by TanStack Start).
2.  **Environment Variables**:
    - `VITE_API_URL`: Your deployed backend API URL (e.g., `https://polyglot-scribe-backend.onrender.com/api`).
    - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
    - `ELEVENLABS_API_KEY`: Required for transcription.
    - `GOOGLE_GEMINI_API_KEY`: Required for translation fallback.
    - `OPENAI_API_KEY`: (Optional) For Whisper fallback.

---

## 3. External Service Configuration

### Google Cloud Console (OAuth)
- **Authorized JavaScript Origins**: Add your frontend URL (e.g., `https://polyglotscribe.pages.dev`).
- **Authorized Redirect URIs**: Add `https://[YOUR_BACKEND_DOMAIN]/api/auth/google/callback`.

### MongoDB Atlas
- Go to **Network Access** and add `0.0.0.0/0` (or Render's outbound IP range) to the IP Whitelist.

### Chapa
- In your Chapa dashboard, ensure the **Webhook URL** is set to `https://[YOUR_BACKEND_DOMAIN]/api/public/chapa-webhook`.

---

## 4. Final Verification
- Visit your backend URL: You should see a "Polyglot Scribe API is live" message.
- Visit `/health` on the backend.
- Test the frontend login flow and transcription features.
