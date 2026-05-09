# 🔄 Restart Backend and Test

## Step 1: Restart Backend Server

1. **Stop the current server** (Ctrl+C in the terminal)

2. **Start it again:**
   ```powershell
   cd backend
   npm run dev
   ```

3. **Wait for:**
   ```
   ✅ MongoDB Connected: ...
   🚀 Server running in development mode on port 5000
   ```

---

## Step 2: Test Signup

1. **Go to:** http://localhost:8080/auth

2. **Fill in the form:**
   - Email: `test@example.com`
   - Password: `password123`
   - Display Name: `Test User`

3. **Click "Sign Up"**

4. **Watch the backend terminal** - you should see detailed logs like:
   ```
   [Signup] Received request
   [Signup] Body: {
     "email": "test@example.com",
     "password": "password123",
     "displayName": "Test User"
   }
   [Signup] Extracted: { email: 'test@example.com', password: '***', displayName: 'Test User' }
   ```

---

## Step 3: Check for Errors

### If you see validation errors:
```
POST /api/auth/signup 400 ...
```

**Check the terminal for:**
- What fields are missing
- What validation failed
- The exact error message

### If you see success:
```
✅ Email sent: <message-id>
POST /api/auth/signup 201 ...
```

**Then:**
- Check your email for OTP
- Enter the 6-digit code
- You should be signed in!

---

## 🐛 Common Issues:

### Issue 1: "User already exists"
**Solution:** Use a different email address

### Issue 2: "Validation failed"
**Solution:** Check the terminal logs to see which field failed validation

### Issue 3: "Email not sent"
**Solution:** Check Gmail app password in `backend/.env`

---

## 📊 What to Share:

If it still doesn't work, share:
1. The backend terminal output (the [Signup] logs)
2. Any error messages in the browser console (F12)
3. The exact error message shown in the UI

This will help me identify the exact issue!
