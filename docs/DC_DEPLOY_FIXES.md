# 🔴 DC Deploy Frontend Configuration - CRITICAL FIXES NEEDED

**Date:** 2024-11-25  
**Issue:** Frontend container keeps restarting

---

## 🚨 Problems Found in Your DC Deploy Configuration

Based on the screenshot and logs, here are the **critical issues**:

### ❌ **ISSUE 1: Wrong Port**
**Current:** Port set to `5173`  
**Should be:** Port `80`

**Why:**
- Port 5173 is for Vite dev server (development)
- Port 80 is for Nginx production server (what's in Dockerfile)
- DC Deploy is trying to route to 5173, but Nginx listens on 80
- This causes connection failures and container restarts

**Fix:**
Change port from `5173` → `80` in DC Deploy frontend service settings

---

### ❌ **ISSUE 2: VITE Variables Set as Runtime Env Vars**
**Current:** `VITE_FRONTEND_URL` is in "Environment Variables" section  
**Should be:** Set as **Build Arguments**

**Why:**
- Vite embeds environment variables at **build time**, not runtime
- Setting them as runtime env vars does nothing
- The app is built with default/empty values
- API calls will fail because `VITE_API_URL` isn't set correctly

**Fix:**
1. Remove `VITE_FRONTEND_URL` from "Environment Variables" section
2. Add ALL `VITE_*` variables to **"Build Arguments"** section
3. Rebuild the service

---

## ✅ Correct Configuration

### Frontend Service Settings in DC Deploy:

#### **Network Section**
```
Port: 80          ← Change from 5173 to 80
Protocol: https
```

#### **Build Arguments Section** (⚠️ NOT Environment Variables!)
```
VITE_API_URL=https://backend-9gzu6ya5n8.dcdeploy.cloud/api
VITE_FRONTEND_URL=https://frontend-9gzu6ya5n8.dcdeploy.cloud
VITE_CASHFREE_APP_ID=TEST10848247ba007d82db4dc78223f674284801
VITE_CASHFREE_MODE=sandbox
```

#### **Environment Variables Section**
- ❌ **DO NOT add VITE_* variables here**
- This section is for runtime Node.js env vars only
- Leave it empty for frontend (Nginx doesn't need runtime env vars)

---

## 📋 Step-by-Step Fix in DC Deploy

### Step 1: Fix Port

1. Go to your frontend service in DC Deploy
2. Find "Network" or "Port" setting
3. Change port from `5173` to `80`
4. Save settings

### Step 2: Fix Build Arguments

1. Find **"Build Arguments"** section (NOT "Environment Variables")
2. If you see "Build Arguments", click "+ Add" or edit
3. Add these 4 build arguments:

| Build Argument Name | Build Argument Value |
|---------------------|---------------------|
| `VITE_API_URL` | `https://backend-9gzu6ya5n8.dcdeploy.cloud/api` |
| `VITE_FRONTEND_URL` | `https://frontend-9gzu6ya5n8.dcdeploy.cloud` |
| `VITE_CASHFREE_APP_ID` | `TEST10848247ba007d82db4dc78223f674284801` |
| `VITE_CASHFREE_MODE` | `sandbox` |

4. **Important:** Use your actual backend URL (replace example)
5. Frontend URL will be assigned by DC Deploy after first successful deploy

### Step 3: Remove from Environment Variables

1. Go to "Environment Variables" section
2. If you see `VITE_FRONTEND_URL` or any `VITE_*` variables:
   - **Delete them** (click trash icon)
3. These should NOT be here

### Step 4: Rebuild and Deploy

1. After making changes, click "Deploy" or "Save & Deploy"
2. The service will rebuild with correct build arguments
3. Monitor build logs to verify it builds successfully
4. Check that container starts and stays running

---

## 🔍 How to Verify Fixes

### After Fixing Port:
- Container should stay running (no SIGQUIT signals)
- Health check should pass
- Can access frontend at assigned URL

### After Fixing Build Arguments:
- Build logs should show successful build
- Frontend should load in browser
- API calls should work (check browser Network tab)
- No CORS errors in console

---

## 📝 Quick Checklist

Before deploying, verify:

- [ ] Port is set to **80** (not 5173)
- [ ] Protocol is **https**
- [ ] Build Arguments section has:
  - [ ] `VITE_API_URL` = your backend URL + `/api`
  - [ ] `VITE_FRONTEND_URL` = your frontend URL
  - [ ] `VITE_CASHFREE_APP_ID` = your app ID
  - [ ] `VITE_CASHFREE_MODE` = `sandbox`
- [ ] **NO** `VITE_*` variables in Environment Variables section
- [ ] Context is `./frontend`
- [ ] Dockerfile is `./Dockerfile`

---

## 🎯 Expected Results After Fix

✅ Build succeeds  
✅ Container starts and stays running  
✅ Health check passes  
✅ Frontend accessible at assigned URL  
✅ API calls work correctly  
✅ No SIGQUIT shutdown signals  

---

**Status:** ⚠️ **CRITICAL FIXES NEEDED**  
**Action Required:** Update DC Deploy frontend service configuration


