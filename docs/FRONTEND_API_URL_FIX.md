# 🔴 Frontend API URL Fix - Registration Not Working

**Date:** 2024-11-25  
**Issue:** Frontend trying to call `localhost:3001` instead of production backend  
**Symptom:** Registration fails with 404 errors

---

## 🐛 Problem

The frontend is calling:
- ❌ `http://localhost:3001/api/auth/register` (404 Not Found)
- ❌ `http://localhost:3001/api/auth/me` (404 Not Found)

**Root Cause:**
- `VITE_API_URL` build argument was not set (or set incorrectly) during Docker build
- Frontend fell back to default value: `http://localhost:3001`
- This works for local development, but fails in production

---

## ✅ Solution

You need to:
1. **Find your backend URL** in DC Deploy
2. **Set `VITE_API_URL` as a Build Argument** pointing to your backend
3. **Rebuild the frontend service**

---

## 📋 Step-by-Step Fix

### Step 1: Find Your Backend URL

1. Go to DC Deploy dashboard
2. Navigate to your **backend service**
3. Find the service URL (it should be something like):
   - `https://backend-9gzu6ya5n8.dcdeploy.cloud`
   - Or check the "Networking" or "Domain" section

### Step 2: Update Frontend Build Arguments

1. Go to your **frontend service** in DC Deploy
2. Find **"Build Arguments"** section (NOT "Environment Variables")
3. Add or update `VITE_API_URL`:

```
VITE_API_URL=https://your-backend-url.dcdeploy.cloud/api
```

**Important:**
- Must include `/api` at the end
- Must use `https://` protocol
- Replace `your-backend-url.dcdeploy.cloud` with your actual backend URL

**Example:**
```
VITE_API_URL=https://backend-9gzu6ya5n8.dcdeploy.cloud/api
```

### Step 3: Rebuild Frontend Service

1. After updating build arguments, click **"Deploy"** or **"Rebuild"**
2. Wait for build to complete
3. Frontend will be rebuilt with correct API URL embedded

### Step 4: Verify Fix

1. Clear browser cache or open in incognito mode
2. Visit frontend URL
3. Try to register again
4. Check browser console - should see calls to correct backend URL

---

## 🔍 How to Verify Build Arguments Are Set

### Option 1: Check DC Deploy UI
- Look for "Build Arguments" section in frontend service settings
- Should see `VITE_API_URL` listed there

### Option 2: Check Build Logs
- Look for build logs that show environment variables
- Or check that build succeeded with new arguments

### Option 3: Inspect Built Code (Advanced)
- After rebuild, the JavaScript bundle will have the API URL hardcoded
- Browser console will show the actual URL being called

---

## 📝 Complete Build Arguments Checklist

Make sure these are ALL set as **Build Arguments**:

```
VITE_API_URL=https://your-backend-url.dcdeploy.cloud/api
VITE_FRONTEND_URL=https://frontend-9gzu6ya5n8.dcdeploy.cloud
VITE_CASHFREE_APP_ID=TEST10848247ba007d82db4dc78223f674284801
VITE_CASHFREE_MODE=sandbox
```

---

## 🚨 Common Mistakes

### ❌ Wrong URL Format
```
VITE_API_URL=backend-9gzu6ya5n8.dcdeploy.cloud/api    ❌ Missing https://
VITE_API_URL=https://backend-9gzu6ya5n8.dcdeploy.cloud ❌ Missing /api
```
✅ **Correct:**
```
VITE_API_URL=https://backend-9gzu6ya5n8.dcdeploy.cloud/api
```

### ❌ Set as Environment Variable Instead of Build Argument
- Setting in "Environment Variables" section won't work
- Must be in "Build Arguments" section
- Frontend needs to be rebuilt after changing

### ❌ Not Rebuilding After Change
- Changing build arguments requires a rebuild
- Old build still has old URL embedded
- Must trigger a new build/deploy

---

## ✅ After Fix

Once you've set the correct `VITE_API_URL` and rebuilt:

1. ✅ Frontend will call correct backend URL
2. ✅ Registration will work
3. ✅ Login will work
4. ✅ All API calls will work

**Test:**
- Visit: `https://frontend-9gzu6ya5n8.dcdeploy.cloud/register`
- Fill registration form
- Should successfully create account (no 404 errors)

---

**Status:** ⚠️ **REBUILD REQUIRED**  
**Action:** Set `VITE_API_URL` build argument and rebuild frontend service


