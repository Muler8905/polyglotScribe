# ✅ Updated API Keys Guide

## 🎯 Good News!

You already have **ElevenLabs API key** configured! ✅

Now you just need **ONE more API key** for translation.

---

## 🔑 What You Need

### 1. ✅ ElevenLabs API Key (Already Configured!)
```
Status: ✅ DONE
Your key: sk_715805b5130f6f6d20e7acf3c34a687001c1d3c02bacda7a
```

**This enables**:
- 🎤 Live microphone transcription
- 📁 Audio file transcription
- 🎥 YouTube video transcription
- 🔊 Text-to-speech

---

### 2. ⚠️ Translation API Key (Choose ONE)

**Important**: Lovable API is NOT publicly available. I've updated the code to support two alternatives:

#### Option A: Google Gemini API (Recommended ⭐)
```
✅ FREE tier available
✅ 15 requests per minute
✅ Easy to get
✅ Great for Ethiopian languages
```

**Get it here**: https://aistudio.google.com/app/apikey

**Steps**:
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `.env`: `GOOGLE_GEMINI_API_KEY=your_key_here`

---

#### Option B: OpenAI API (Alternative)
```
⚠️ Paid service (starts at $5)
✅ High quality translations
✅ Well-documented
```

**Get it here**: https://platform.openai.com/api-keys

**Steps**:
1. Go to https://platform.openai.com/api-keys
2. Sign up / Sign in
3. Add payment method ($5 minimum)
4. Create new API key
5. Add to `.env`: `OPENAI_API_KEY=your_key_here`

---

## ⚡ Quick Setup

### Step 1: Choose Your Translation Provider

**I recommend Google Gemini** because:
- ✅ Free tier (no credit card needed)
- ✅ 15 requests/minute is plenty
- ✅ Excellent quality for Ethiopian languages
- ✅ Easy to set up

### Step 2: Get API Key

Go to: https://aistudio.google.com/app/apikey

1. Sign in with Google
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### Step 3: Add to .env File

Open: `c:\Users\muluk\Downloads\live-speech-transcribe\.env`

Add this line:
```bash
GOOGLE_GEMINI_API_KEY=AIzaYourActualKeyHere
```

Your complete `.env` should look like:
```bash
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# ElevenLabs API Key (Already configured ✅)
ELEVENLABS_API_KEY=sk_715805b5130f6f6d20e7acf3c34a687001c1d3c02bacda7a

# Google Gemini API Key (Add this)
GOOGLE_GEMINI_API_KEY=AIzaYourActualKeyHere
```

### Step 4: Restart Frontend

```bash
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

---

## ✅ Test Everything

### 1. Test Transcription (Should Already Work!)
- ✅ Live: Dashboard → Live tab → Start Recording
- ✅ File: Dashboard → File tab → Upload audio
- ✅ YouTube: Dashboard → YouTube tab → Paste URL

### 2. Test Translation (After adding Gemini key)
- After transcribing, select target language
- Click "Translate"
- Should see translation in Amharic, Oromo, or Somali

---

## 🔄 What I Changed

### Updated Code
I modified `src/server/translate.server.ts` to support:
1. **Google Gemini API** (free, recommended)
2. **OpenAI API** (paid alternative)
3. Removed dependency on Lovable API (not publicly available)

### How It Works Now
The code checks for API keys in this order:
1. If `GOOGLE_GEMINI_API_KEY` exists → Use Gemini
2. Else if `OPENAI_API_KEY` exists → Use OpenAI
3. Else → Show error message

---

## 💰 Cost Comparison

| Provider | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Google Gemini** | ✅ Yes (15 req/min) | $0.00035/1K chars | Testing & Production |
| **OpenAI** | ❌ No | $0.15/1M tokens | High volume |
| **ElevenLabs** | ✅ Yes (10K chars/mo) | $5-99/month | Already configured ✅ |

**Recommendation**: Use Google Gemini for translation (free + excellent quality)

---

## 🐛 Troubleshooting

### Error: "Translation API key not configured"
**Solution**: Add `GOOGLE_GEMINI_API_KEY` to `.env` and restart

### Error: "Rate limit exceeded"
**Solution**: 
- Gemini: Wait 1 minute (15 requests/min limit)
- OpenAI: Check your usage limits

### Translation quality issues
**Solution**: Both Gemini and OpenAI provide excellent quality. If you notice issues, try the other provider.

### Transcription not working
**Good news**: Your ElevenLabs key is already configured! If transcription doesn't work:
1. Check you have credits remaining at https://elevenlabs.io/
2. Verify microphone permissions (for live)
3. Check file format (for file upload)

---

## 📊 Current Status

| Feature | Status | API Key |
|---------|--------|---------|
| Live Transcription | ✅ Ready | ElevenLabs (configured) |
| File Transcription | ✅ Ready | ElevenLabs (configured) |
| YouTube Transcription | ✅ Ready | ElevenLabs (configured) |
| Text-to-Speech | ✅ Ready | ElevenLabs (configured) |
| Translation | ⚠️ Needs Key | Google Gemini (add it) |

---

## 🎉 Summary

### What You Have:
✅ ElevenLabs API key configured
✅ All transcription features ready to use
✅ Backend and frontend running

### What You Need:
⚠️ Add Google Gemini API key for translation

### Time to Complete:
⏱️ 2 minutes (sign up + copy key + paste in .env + restart)

---

## 🚀 Next Steps

1. **Get Gemini API key**: https://aistudio.google.com/app/apikey
2. **Add to .env**: `GOOGLE_GEMINI_API_KEY=your_key`
3. **Restart frontend**: `npm run dev`
4. **Test translation**: Transcribe → Select language → Translate

**That's it! You're almost there! 🎉**
