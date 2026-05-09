# API Keys Setup Guide

Your application requires two API keys to enable transcription and translation features.

---

## 🎙️ ElevenLabs API Key (Required for Transcription)

### What it's used for:
- **Live Speech Transcription** - Real-time microphone transcription
- **Audio File Transcription** - Upload and transcribe audio files
- **YouTube Video Transcription** - Extract and transcribe YouTube videos

### How to get it:

1. **Sign up for ElevenLabs**
   - Go to: https://elevenlabs.io/
   - Click "Sign Up" or "Get Started"
   - Create a free account

2. **Get your API Key**
   - After signing in, go to: https://elevenlabs.io/app/settings/api-keys
   - Or navigate: Profile → Settings → API Keys
   - Click "Create API Key" or copy your existing key

3. **Add to your .env file**
   ```bash
   ELEVENLABS_API_KEY=sk_your_actual_api_key_here
   ```

### Pricing:
- **Free Tier**: 10,000 characters/month (good for testing)
- **Starter**: $5/month - 30,000 characters
- **Creator**: $22/month - 100,000 characters
- **Pro**: $99/month - 500,000 characters

**Note**: The free tier is sufficient for testing and light usage!

---

## 🌐 Lovable API Key (Required for Translation)

### What it's used for:
- **Translation** - Translate transcripts between:
  - English
  - Amharic (አማርኛ)
  - Afaan Oromo
  - Somali

### How to get it:

1. **Sign up for Lovable**
   - Go to: https://lovable.dev/
   - Click "Sign Up" or "Get Started"
   - Create an account

2. **Get your API Key**
   - After signing in, go to your workspace settings
   - Look for "API Keys" or "Developer Settings"
   - Generate a new API key

3. **Add to your .env file**
   ```bash
   LOVABLE_API_KEY=your_lovable_api_key_here
   ```

### Pricing:
- Check Lovable's pricing page for current rates
- They typically offer a free tier for testing

---

## 📝 Complete Setup Steps

### 1. Update your `.env` file

Open `c:\Users\muluk\Downloads\live-speech-transcribe\.env` and add:

```bash
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# ElevenLabs API Key (Required for transcription features)
ELEVENLABS_API_KEY=sk_your_elevenlabs_api_key_here

# Lovable API Key (Required for translation features)
LOVABLE_API_KEY=your_lovable_api_key_here
```

### 2. Restart your frontend server

After adding the API keys, restart the frontend:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Test the features

Once configured, you can test:

#### Live Transcription
1. Go to Dashboard
2. Click "Live" tab
3. Click "Start Recording"
4. Speak into your microphone
5. See real-time transcription

#### File Transcription
1. Go to Dashboard
2. Click "File" tab
3. Upload an audio file (MP3, WAV, etc.)
4. Wait for transcription

#### YouTube Transcription
1. Go to Dashboard
2. Click "YouTube" tab
3. Paste a YouTube URL
4. Click "Transcribe"
5. Wait for processing

#### Translation
1. After transcribing, select a target language
2. Click "Translate"
3. See the translated text

---

## 🔍 Troubleshooting

### Error: "ELEVENLABS_API_KEY is not configured"
- Make sure you added the key to `.env` file
- Restart the frontend server after adding the key
- Check that the key starts with `sk_` (ElevenLabs format)

### Error: "LOVABLE_API_KEY is not configured"
- Make sure you added the key to `.env` file
- Restart the frontend server
- Verify the key is correct from Lovable dashboard

### Transcription not working
1. Check browser console for errors
2. Verify API key is valid (test on ElevenLabs website)
3. Check if you have credits remaining in your ElevenLabs account
4. Ensure microphone permissions are granted (for live transcription)

### Translation not working
1. Check browser console for errors
2. Verify Lovable API key is valid
3. Check if you have credits remaining in your Lovable account

### Rate limit errors
- **ElevenLabs**: You've exceeded your monthly character limit
  - Solution: Upgrade your plan or wait for next month
- **Lovable**: Rate limit exceeded
  - Solution: Wait a few minutes and try again

---

## 💡 Tips

### For Testing (Free Tier)
- Use short audio clips to conserve credits
- Test with 1-2 minute YouTube videos
- Keep transcripts under 1000 characters

### For Production
- Consider upgrading to paid tiers for higher limits
- Monitor your usage in the respective dashboards
- Set up usage alerts if available

### Security
- **Never commit API keys to Git**
- Keep your `.env` file private
- Rotate keys if accidentally exposed
- Use environment variables in production

---

## 📊 Feature Requirements Summary

| Feature | Requires ElevenLabs | Requires Lovable |
|---------|-------------------|------------------|
| Live Speech Transcription | ✅ Yes | ❌ No |
| Audio File Transcription | ✅ Yes | ❌ No |
| YouTube Transcription | ✅ Yes | ❌ No |
| Translation | ❌ No | ✅ Yes |
| Text-to-Speech (TTS) | ✅ Yes | ❌ No |

---

## 🚀 Quick Start Checklist

- [ ] Sign up for ElevenLabs account
- [ ] Get ElevenLabs API key
- [ ] Sign up for Lovable account
- [ ] Get Lovable API key
- [ ] Add both keys to `.env` file
- [ ] Restart frontend server
- [ ] Test live transcription
- [ ] Test file upload transcription
- [ ] Test YouTube transcription
- [ ] Test translation feature

---

## 📞 Support

### ElevenLabs Support
- Documentation: https://elevenlabs.io/docs
- Support: https://elevenlabs.io/support

### Lovable Support
- Documentation: https://lovable.dev/docs
- Support: Check their website for contact info

---

## 🎉 You're All Set!

Once you've added both API keys and restarted the server, all transcription and translation features will work perfectly!

**Happy transcribing! 🎤✨**
