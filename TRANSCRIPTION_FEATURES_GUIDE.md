# Transcription Features Guide

## 🎯 Overview

Your application has **3 transcription modes** and **1 translation feature**:

1. **Live Speech Transcription** - Real-time microphone transcription
2. **Audio File Transcription** - Upload and transcribe audio files
3. **YouTube Video Transcription** - Extract and transcribe YouTube videos
4. **Translation** - Translate transcripts between 4 languages

---

## 🔑 Required API Keys

All features require API keys to work:

| Feature | API Provider | API Key Required |
|---------|-------------|------------------|
| Live Transcription | ElevenLabs | `ELEVENLABS_API_KEY` |
| File Transcription | ElevenLabs | `ELEVENLABS_API_KEY` |
| YouTube Transcription | ElevenLabs | `ELEVENLABS_API_KEY` |
| Translation | Lovable | `LOVABLE_API_KEY` |
| Text-to-Speech | ElevenLabs | `ELEVENLABS_API_KEY` |

---

## 🚀 How Each Feature Works

### 1. Live Speech Transcription

**Technology**: ElevenLabs Scribe (Real-time WebSocket)

**How it works**:
1. User clicks "Start Recording" in the Live tab
2. Browser requests microphone permission
3. Frontend creates a single-use token from ElevenLabs API
4. Opens WebSocket connection to ElevenLabs Scribe
5. Streams audio chunks in real-time
6. Receives transcription as user speaks
7. Displays partial results immediately
8. Finalizes transcript when user stops

**Features**:
- Real-time transcription (see words as you speak)
- Speaker diarization (identifies different speakers)
- Audio event tagging (laughter, applause, music)
- Word-level timestamps
- Auto language detection or manual selection

**Supported Languages**:
- English
- Amharic (አማርኛ)
- Afaan Oromo
- Somali
- And 20+ more languages

**Requirements**:
- Microphone access
- HTTPS connection (or localhost)
- `ELEVENLABS_API_KEY` configured

---

### 2. Audio File Transcription

**Technology**: ElevenLabs Scribe v2 (File Upload API)

**How it works**:
1. User uploads audio file in the File tab
2. File is sent to backend API route `/api/transcribe-file`
3. Backend forwards file to ElevenLabs Speech-to-Text API
4. ElevenLabs processes the entire file
5. Returns complete transcript with metadata
6. Transcript is saved to MongoDB
7. User can view, edit, translate, or download

**Supported File Formats**:
- MP3
- WAV
- M4A
- FLAC
- OGG
- WebM
- And more audio formats

**Features**:
- High-accuracy transcription (Scribe v2 model)
- Speaker diarization
- Audio event tagging
- Word-level timestamps
- Language detection or manual selection

**File Size Limits**:
- Check ElevenLabs documentation for current limits
- Typically up to 25MB per file

**Requirements**:
- `ELEVENLABS_API_KEY` configured
- Valid audio file

---

### 3. YouTube Video Transcription

**Technology**: Custom YouTube audio extraction + ElevenLabs Scribe

**How it works**:
1. User pastes YouTube URL in the YouTube tab
2. Backend extracts video metadata from YouTube
3. Finds direct audio stream URL (mobile API)
4. Downloads audio stream (up to 30 minutes)
5. Converts to audio file
6. Sends to ElevenLabs for transcription
7. Returns transcript with video metadata
8. Saves to MongoDB

**Features**:
- No YouTube captions required (transcribes actual audio)
- Works with any public YouTube video
- Supports videos up to 30 minutes
- Extracts video title and metadata
- Same transcription quality as file upload

**Supported Videos**:
- Public YouTube videos
- Unlisted videos (with link)
- Videos with or without captions
- Music videos, podcasts, lectures, etc.

**Limitations**:
- Maximum 30 minutes duration
- Must be publicly accessible
- Age-restricted videos may not work
- Private videos won't work

**Requirements**:
- `ELEVENLABS_API_KEY` configured
- Valid YouTube URL

---

### 4. Translation

**Technology**: Lovable AI Gateway (Google Gemini 2.5 Pro)

**How it works**:
1. User transcribes audio (any method)
2. Selects target language
3. Clicks "Translate" button
4. Frontend sends transcript to backend
5. Backend calls Lovable AI API with specialized prompt
6. AI translates with cultural and linguistic accuracy
7. Returns natural, idiomatic translation
8. User can save, copy, or download

**Supported Languages**:
- **English** ↔ All others
- **Amharic (አማርኛ)** - Ethiopic script (Fidel)
- **Afaan Oromo** - Qubee Latin alphabet
- **Somali** - Standard Somali Latin orthography

**Translation Quality**:
- Professional-grade translation
- Preserves meaning, tone, and nuance
- Natural, idiomatic output
- Proper cultural context
- Correct grammar and spelling

**Features**:
- Preserves formatting (line breaks, lists)
- Keeps proper nouns unchanged
- Maintains numbers, URLs, emails
- Handles technical terms correctly
- Detects if already in target language

**Requirements**:
- `LOVABLE_API_KEY` configured
- Existing transcript to translate

---

## 🎤 Text-to-Speech (TTS)

**Technology**: ElevenLabs TTS (Multilingual v2)

**How it works**:
1. User has transcript or translation
2. Clicks "Play" button
3. Frontend sends text to backend
4. Backend calls ElevenLabs TTS API
5. Returns audio as base64 MP3
6. Frontend plays audio in browser

**Features**:
- Natural-sounding voices
- Multilingual support
- High-quality audio (44.1kHz, 128kbps MP3)
- Adjustable voice settings

**Requirements**:
- `ELEVENLABS_API_KEY` configured
- Text to speak

---

## 💾 Data Storage

All transcriptions are saved to MongoDB with:

```javascript
{
  userId: ObjectId,           // User who created it
  type: "live|file|youtube",  // Transcription type
  title: String,              // User-provided or auto-generated
  transcript: String,         // Original transcript
  sourceLang: String,         // Source language code
  targetLang: String,         // Target language code (if translated)
  translation: String,        // Translated text (if any)
  sourceUrl: String,          // YouTube URL (if applicable)
  status: String,             // "completed", "processing", "failed"
  durationSeconds: Number,    // Audio duration
  metadata: Object,           // Additional data (video title, etc.)
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Security & Privacy

### API Keys
- Stored in `.env` file (never committed to Git)
- Only accessible on server-side
- Never exposed to frontend/browser
- Single-use tokens for real-time transcription

### User Data
- Transcripts stored in user's MongoDB account
- Only accessible by authenticated user
- Admin can view/delete user transcriptions
- No data shared with third parties

### Audio Processing
- Audio sent to ElevenLabs for processing
- Not stored permanently by ElevenLabs
- Check ElevenLabs privacy policy for details

---

## 📊 Usage Limits & Pricing

### ElevenLabs Free Tier
- **10,000 characters/month**
- Includes transcription + TTS
- Good for testing and light usage
- Resets monthly

### ElevenLabs Paid Plans
- **Starter**: $5/month - 30,000 characters
- **Creator**: $22/month - 100,000 characters
- **Pro**: $99/month - 500,000 characters
- **Scale**: Custom pricing

### Lovable Pricing
- Check https://lovable.dev/ for current pricing
- Typically offers free tier for testing

### Character Counting
- **Transcription**: Counts output characters
- **Translation**: Counts input + output
- **TTS**: Counts input characters
- Example: 1 minute of speech ≈ 150-200 characters

---

## 🐛 Troubleshooting

### "API_KEY is not configured"
**Problem**: Missing API key in `.env` file
**Solution**: 
1. Add key to `.env` file
2. Restart frontend server
3. Check key format is correct

### Microphone not working (Live)
**Problem**: Browser doesn't have microphone access
**Solution**:
1. Check browser permissions
2. Use HTTPS or localhost
3. Try different browser
4. Check microphone is not used by another app

### File upload fails
**Problem**: File format not supported or too large
**Solution**:
1. Convert to MP3 or WAV
2. Reduce file size (compress audio)
3. Check file is not corrupted
4. Try shorter audio clip

### YouTube transcription fails
**Problem**: Video not accessible or too long
**Solution**:
1. Check video is public
2. Verify URL is correct
3. Try shorter video (under 30 min)
4. Check video is not age-restricted

### Translation fails
**Problem**: API key invalid or rate limited
**Solution**:
1. Verify Lovable API key
2. Check credits remaining
3. Wait a few minutes (rate limit)
4. Try shorter text

### "Rate limit exceeded"
**Problem**: Used up monthly quota
**Solution**:
1. Wait for monthly reset
2. Upgrade to paid plan
3. Use shorter audio/text

---

## 🎯 Best Practices

### For Accurate Transcription
- Use clear audio with minimal background noise
- Speak clearly and at moderate pace
- Use good quality microphone
- Avoid overlapping speakers
- Select correct source language

### For Better Translation
- Use complete sentences
- Provide context when needed
- Review and edit if necessary
- Use appropriate formality level

### For Cost Efficiency
- Test with short clips first
- Use appropriate quality settings
- Monitor usage in dashboards
- Cache translations when possible

---

## 📚 API Documentation

### ElevenLabs
- Docs: https://elevenlabs.io/docs
- API Reference: https://elevenlabs.io/docs/api-reference
- Scribe: https://elevenlabs.io/docs/product/scribe

### Lovable
- Website: https://lovable.dev/
- Check their docs for API details

---

## ✅ Feature Checklist

- [ ] ElevenLabs API key configured
- [ ] Lovable API key configured
- [ ] Live transcription tested
- [ ] File upload tested
- [ ] YouTube transcription tested
- [ ] Translation tested
- [ ] Text-to-speech tested
- [ ] Transcripts saving to database
- [ ] User can view history
- [ ] User can edit/delete transcripts

---

## 🎉 You're Ready!

All transcription features are fully implemented and ready to use. Just add your API keys and start transcribing!

**Happy transcribing! 🎤✨**
