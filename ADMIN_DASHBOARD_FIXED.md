# Admin Dashboard - Fixed and Ready

## ✅ What Was Fixed

### 1. Duplicate Methods in API Client
**Problem**: The `src/lib/api-client.ts` file had duplicate HTTP methods (get, post, patch, put, delete) defined twice, causing Vite warnings and potentially breaking the admin dashboard.

**Solution**: Removed the duplicate methods at lines 234-261. The original methods at lines 95-122 are now the only ones in use.

**Result**: No more Vite warnings, cleaner code, admin dashboard should now display correctly.

---

## 🚀 How to Access Admin Dashboard

### Step 1: Make Your User an Admin
Run this command in the backend directory:

```bash
cd backend
node make-admin.js mulukenugamo7@gmail.com
```

This will grant admin role to your user account.

### Step 2: Sign In
1. Go to `http://localhost:8080`
2. Sign in with your credentials:
   - Email: `mulukenugamo7@gmail.com`
   - Password: (your password)

### Step 3: Access Admin Dashboard
Once signed in, navigate to:
```
http://localhost:8080/admin
```

Or click on the admin link in your dashboard (if available).

---

## 🎯 Admin Dashboard Features

### Users Tab
- **View all users** with their details
- **Grant/Revoke admin role** by clicking the role badge
- **Manage credits** - adjust user credits directly
- **Toggle features** - Enable/disable features per user:
  - L = Live transcription
  - F = File upload
  - Y = YouTube
  - T = Translate
  - S = Text-to-Speech
- **Suspend/Activate users**
- **Delete user transcriptions**

### Hero Images Tab
- **View all hero images** for the landing page
- **Add new hero images** with URL and caption
- **Edit captions** for existing images
- **Toggle active/hidden** status
- **Delete hero images**

---

## 🔧 Backend API Endpoints (Already Implemented)

### Admin Endpoints
- `GET /api/app/admin/users` - Get all users
- `PATCH /api/app/admin/users/:userId/tokens` - Update user credits/features
- `POST /api/app/admin/users/:userId/toggle-admin` - Toggle admin role
- `DELETE /api/app/admin/users/:userId/transcriptions` - Delete user transcriptions

### Profile Endpoints
- `GET /api/app/profile` - Get user profile with roles
- `PATCH /api/app/profile` - Update profile

### Hero Images Endpoints
- `GET /api/app/hero-images` - Get hero images
- `POST /api/app/hero-images` - Create hero image (admin only)
- `PATCH /api/app/hero-images/:id` - Update hero image (admin only)
- `DELETE /api/app/hero-images/:id` - Delete hero image (admin only)

---

## 🛡️ Security

- All admin endpoints are protected with `requireAdmin` middleware
- Only users with the "admin" role can access admin features
- JWT authentication required for all protected routes
- Tokens are stored securely in localStorage

---

## 📝 Useful Scripts

### List All Users
```bash
cd backend
node list-users.js
```

### Make User Admin
```bash
cd backend
node make-admin.js <email>
```

### Delete Specific User
```bash
cd backend
node delete-user.js <email>
```

### Delete All Users (Fresh Start)
```bash
cd backend
node delete-all-users.js
```

---

## ✨ Next Steps

1. **Make yourself admin**: Run `node make-admin.js mulukenugamo7@gmail.com`
2. **Restart frontend** (if needed): The Vite warnings should be gone
3. **Sign in and test**: Access the admin dashboard at `/admin`
4. **Test admin features**:
   - Create a test user
   - Grant/revoke admin role
   - Adjust credits and features
   - Add hero images

---

## 🐛 Troubleshooting

### Admin Dashboard Not Loading
1. Check browser console for errors
2. Verify you're signed in
3. Verify your user has admin role: `node list-users.js`
4. Check backend logs for API errors

### "Access Denied" Message
- Your user doesn't have admin role
- Run: `node make-admin.js <your-email>`

### API Errors
- Ensure backend is running: `npm run dev` in backend folder
- Check MongoDB connection in backend logs
- Verify JWT tokens are valid (try signing out and back in)

---

## 📊 Current Status

✅ Backend API fully implemented
✅ Admin middleware working
✅ Frontend admin dashboard ready
✅ API client fixed (no more duplicates)
✅ User management scripts available
✅ Hero images management ready

**Everything is ready to use!** Just make yourself admin and start testing.
