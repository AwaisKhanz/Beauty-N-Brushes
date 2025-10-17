# Authentication & Refresh Token Troubleshooting Guide

## Issue: Getting 401 "Invalid or expired token" errors

---

## Quick Diagnosis

### Check 1: Are you logged in?

Open browser DevTools → Application/Storage → Cookies → http://localhost:3000

**Look for these cookies:**

- `access_token`
- `refresh_token`

**If missing:** You need to log in first.

---

## Common Issues & Solutions

### Issue 1: No Cookies Set

**Symptoms:**

- Getting 401 errors immediately
- No cookies in browser
- Can't access protected routes

**Solution:**

1. Go to `/login`
2. Enter credentials
3. Check if login is successful
4. Verify cookies are set in DevTools

**If login fails to set cookies:**

```typescript
// Check backend CORS configuration in backend/src/server.ts
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // MUST be true
  // ...
};
```

---

### Issue 2: Cookies Not Sent with Requests

**Symptoms:**

- Cookies exist in browser
- Still getting 401 errors
- API calls failing

**Solution:**

Check `frontend/src/lib/api-client.ts`:

```typescript
this.client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ← MUST be true
});
```

---

### Issue 3: Refresh Token Expired

**Symptoms:**

- Was working before
- Now constantly getting 401
- Can't refresh token

**Solution:**

1. **Logout and login again** (clears old tokens)
2. Or **clear browser cookies manually**:
   - DevTools → Application → Cookies → Delete all
   - Then login again

**Token Lifetimes:**

- Access Token: 15 minutes
- Refresh Token: 30 days

---

### Issue 4: ngrok HTTPS Cookie Issues

**Symptoms:**

- Working on localhost
- Fails when using ngrok URL
- Cross-origin cookie problems

**Solution:**

I just updated the cookie configuration to handle ngrok. **Restart your backend server** for the changes to take effect:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

The new cookie config automatically detects ngrok and sets:

- `secure: true` (for HTTPS)
- `sameSite: 'none'` (for cross-origin)

---

## How to Test Refresh Token

### Manual Test:

1. **Login** at `/login`
2. **Check cookies** in DevTools
3. **Wait 16 minutes** (access token expires after 15 min)
4. **Make any API call** (e.g., go to `/provider/dashboard`)
5. **Watch Network tab** in DevTools:
   - Should see a call to `/auth/refresh`
   - Then the original request retries
   - Page loads successfully

### Automated Test:

```bash
# In browser console
// 1. Check current tokens
document.cookie

// 2. Make a test API call
fetch('http://localhost:8000/api/v1/auth/me', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)

// Should return your user data
```

---

## Debug Steps

### Step 1: Check Environment Variables

**Backend** (`.env`):

```bash
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRY=30d
```

### Step 2: Check Browser Console

Look for errors like:

- ❌ "401 Unauthorized"
- ❌ "Token expired"
- ❌ "Invalid or expired token"

### Step 3: Check Network Tab

When you see 401 errors:

1. Open DevTools → Network tab
2. Look for the failed request
3. Check Headers → Cookies
4. Verify `access_token` and `refresh_token` are being sent

### Step 4: Check Backend Logs

Look for:

```
Error: Invalid or expired token
```

This means the token in the cookie is invalid or missing.

---

## Solutions

### Solution 1: Force Re-login

The simplest solution:

```typescript
// 1. Logout
await api.auth.logout();

// 2. Clear cookies manually
document.cookie.split(';').forEach((c) => {
  document.cookie = c
    .replace(/^ +/, '')
    .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
});

// 3. Login again
// Navigate to /login
```

### Solution 2: Fix Cookie Configuration (Already Done)

I've updated the cookie configuration to automatically handle:

- ✅ ngrok HTTPS
- ✅ Cross-origin requests
- ✅ Secure cookies
- ✅ SameSite=none for cross-domain

**Restart backend server** to apply changes.

### Solution 3: Update CORS if Needed

If still having issues, update CORS in `backend/src/server.ts`:

```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://04994f2818de.ngrok-free.app', // Add your ngrok URL
  ],
  credentials: true,
  // ...
};
```

---

## Expected Behavior

### Normal Flow:

```
1. Login → Receive cookies (access_token + refresh_token)
2. Make API calls → Access token sent automatically
3. After 15 minutes → Access token expires
4. Next API call → Gets 401
5. api-client intercepts → Calls /auth/refresh
6. Refresh succeeds → New access_token set
7. Original request retries → Succeeds
8. User never notices!
```

### What You're Seeing (Problem):

```
1. Make API call → Gets 401
2. Refresh attempt fails
3. Error displayed
```

---

## Quick Fix (Try This First)

### Option A: Restart Everything

```bash
# 1. Stop both servers (Ctrl+C in terminal)

# 2. Clear browser data
# DevTools → Application → Clear storage → Clear site data

# 3. Restart servers
npm run dev

# 4. Login again
# Navigate to http://localhost:3000/login
```

### Option B: Check Your .env Files

**Backend `.env`**:

```bash
# Make sure these exist
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`**:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Still Not Working?

Share the following information:

1. **Console errors** (browser DevTools → Console)
2. **Network errors** (DevTools → Network → Click failed request → Preview tab)
3. **Backend logs** (check terminal where backend is running)
4. **Cookie status** (DevTools → Application → Cookies → screenshot)

Then I can provide a more specific fix!

---

## Prevention

To avoid token issues in the future:

1. ✅ Keep backend server running
2. ✅ Don't clear cookies manually
3. ✅ Let auto-refresh handle expired tokens
4. ✅ Logout properly (don't just close browser)
5. ✅ Use same origin (localhost:3000 + localhost:8000)

---

## Summary

**I've fixed the cookie configuration for ngrok.**

**Next steps:**

1. Restart your backend server
2. Clear browser cookies
3. Login again
4. Test if refresh token works

**The refresh token should now work properly!** 🔐
