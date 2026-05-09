# Quick API Keys Setup

## 🎯 What You Need

Your app needs **2 API keys** to work:

### 1. ElevenLabs API Key
**For**: Transcription (Live, File, YouTube)
**Get it**: https://elevenlabs.io/app/settings/api-keys
**Free Tier**: 10,000 characters/month ✅

### 2. Lovable API Key
**For**: Translation (English, Amharic, Oromo, Somali)
**Get it**: https://lovable.dev/
**Free Tier**: Available ✅

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Get API Keys
1. Sign up at https://elevenlabs.io/ → Get API key
2. Sign up at https://lovable.dev/ → Get API key

### Step 2: Add to .env File
Open: `c:\Users\muluk\Downloads\live-speech-transcribe\.env`

Add these lines:
```bash
ELEVENLABS_API_KEY=sk_your_elevenlabs_key_here
LOVABLE_API_KEY=your_lovable_key_here
```

### Step 3: Restart Frontend
```bash
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

---

## ✅ Test It Works

1. **Live Transcription**: Dashboard → Live tab → Start Recording
2. **File Upload**: Dashboard → File tab → Upload audio
3. **YouTube**: Dashboard → YouTube tab → Paste URL
4. **Translation**: After transcribing → Select language → Translate

---

## 🆘 Common Errors

| Error | Solution |
|-------|----------|
| "ELEVENLABS_API_KEY is not configured" | Add key to .env and restart |
| "LOVABLE_API_KEY is not configured" | Add key to .env and restart |
| Transcription fails | Check ElevenLabs credits |
| Translation fails | Check Lovable credits |

---

## 📖 Full Guide

For detailed instructions, see: `API_KEYS_SETUP.md`

---

**That's it! 🎉 Add the keys, restart, and you're ready to transcribe!**
