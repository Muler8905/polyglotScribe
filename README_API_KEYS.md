# 🔑 API Keys Required

## ⚠️ Your app is asking for API keys because transcription features need them!

---

## 🎯 What You Need (2 API Keys)

### 1️⃣ ElevenLabs API Key
```
Purpose: Audio Transcription
Get it: https://elevenlabs.io/app/settings/api-keys
Free: 10,000 characters/month
```

**Used for**:
- 🎤 Live microphone transcription
- 📁 Audio file transcription
- 🎥 YouTube video transcription
- 🔊 Text-to-speech

---

### 2️⃣ Lovable API Key
```
Purpose: Translation
Get it: https://lovable.dev/
Free: Available
```

**Used for**:
- 🌐 Translate between English, Amharic, Oromo, Somali

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Get Keys
1. Go to https://elevenlabs.io/ → Sign up → Get API key
2. Go to https://lovable.dev/ → Sign up → Get API key

### Step 2: Add to .env
Open: `c:\Users\muluk\Downloads\live-speech-transcribe\.env`

Add:
```bash
ELEVENLABS_API_KEY=sk_your_key_here
LOVABLE_API_KEY=your_key_here
```

### Step 3: Restart
```bash
# Press Ctrl+C to stop frontend
# Then restart:
npm run dev
```

---

## ✅ Test It Works

1. **Live**: Dashboard → Live tab → Start Recording → Speak
2. **File**: Dashboard → File tab → Upload audio → Transcribe
3. **YouTube**: Dashboard → YouTube tab → Paste URL → Transcribe
4. **Translate**: After transcribing → Select language → Translate

---

## 🆘 Still Having Issues?

Read the detailed guides:
- `API_KEYS_SETUP.md` - Complete setup guide
- `QUICK_API_SETUP.md` - Quick reference
- `TRANSCRIPTION_FEATURES_GUIDE.md` - How it all works
- `COMPLETE_SETUP_SUMMARY.md` - Full system overview

---

## 💡 Why These APIs?

**ElevenLabs** = Industry-leading speech-to-text technology
- High accuracy
- Real-time transcription
- 20+ languages
- Speaker identification

**Lovable** = AI-powered translation
- Natural, idiomatic translations
- Cultural context awareness
- Specialized for Ethiopian languages

---

## 💰 Cost

**Free Tier is Enough for Testing!**
- ElevenLabs: 10,000 chars/month free
- Lovable: Free tier available
- 1 minute audio ≈ 150-200 characters

**Example**: With free tier, you can transcribe ~50 minutes of audio per month!

---

## 🎉 That's It!

Add the keys → Restart → Start transcribing! 🚀
