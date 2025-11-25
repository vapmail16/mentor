# DC Deploy Frontend Configuration Guide

**Critical:** This guide shows the exact DC Deploy configuration needed for the frontend service.

---

## 🚨 Common Configuration Mistakes

### ❌ **MISTAKE 1: Wrong Port**
- **Wrong:** Port set to `5173` (Vite dev server port)
- **Correct:** Port must be `80` (Nginx production server port)

### ❌ **MISTAKE 2: Environment Variables Instead of Build Arguments**
- **Wrong:** Setting `VITE_API_URL` as a runtime environment variable
- **Correct:** Must be set as **Build Arguments** during Docker build

---

## ✅ Correct DC Deploy Configuration

### Frontend Service Settings

#### **Source Control & Build**
- **ref: Branch:** `main`
- **AutoBuild & Deploy:** ✅ Enabled
- **Context:** `./frontend`
- **Dockerfile Name:** `./Dockerfile`

#### **Network Configuration**
- **Port:** `80` ⚠️ **NOT 5173!**
- **Protocol:** `https` (DC Deploy will handle SSL)

#### **Infrastructure**
- **Regions:** `India` (or your preferred region)
- **Machine Type:** `DCD-1` (or your preferred instance)

#### **Build Arguments** (⚠️ CRITICAL - Must be set here!)
Click on "Build Arguments" or "Build Settings" section and add:

```
VITE_API_URL=https://backend-9gzu6ya5n8.dcdeploy.cloud/api
VITE_FRONTEND_URL=https://frontend-9gzu6ya5n8.dcdeploy.cloud
VITE_CASHFREE_APP_ID=TEST10848247ba007d82db4dc78223f674284801
VITE_CASHFREE_MODE=sandbox
```

**Important Notes:**
- These MUST be **Build Arguments**, NOT runtime environment variables
- `VITE_API_URL` should point to your backend URL + `/api`
- `VITE_FRONTEND_URL` should be your frontend production URL
- Replace the example URLs with your actual DC Deploy URLs

#### **Environment Variables** (Runtime)
- ❌ **DO NOT** add `VITE_*` variables here!
- These are for runtime Node.js environment variables only
- Vite variables are embedded at build time, not runtime

#### **Scale**
- **Instances:** `1` (or as needed)

---

## 📋 Step-by-Step Configuration

### Step 1: Create Frontend Service in DC Deploy

1. Go to DC Deploy dashboard
2. Navigate to your project: `mentor`
3. Click "Add Service" or "New Service"
4. Name it: `frontend` or `mentor-frontend`

### Step 2: Configure Source & Build

1. **Connect Repository:**
   - Source: GitHub
   - Repository: `vapmail16/mentor`
   - Branch: `main`

2. **Build Settings:**
   - Context: `./frontend` (⚠️ Important - relative to repo root)
   - Dockerfile: `./Dockerfile` (in the frontend directory)

3. **Enable Auto Deploy:** ✅ (optional, but recommended)

### Step 3: Configure Build Arguments

**This is the most critical step!**

1. Find **"Build Arguments"** or **"Build Settings"** section
2. Click **"+ Add Build Argument"** or similar
3. Add these **exactly as shown:**

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://backend-9gzu6ya5n8.dcdeploy.cloud/api` |
| `VITE_FRONTEND_URL` | `https://frontend-9gzu6ya5n8.dcdeploy.cloud` |
| `VITE_CASHFREE_APP_ID` | `TEST10848247ba007d82db4dc78223f674284801` |
| `VITE_CASHFREE_MODE` | `sandbox` |

**Replace URLs with your actual DC Deploy URLs:**
- Backend URL: Check your backend service URL in DC Deploy
- Frontend URL: This will be assigned by DC Deploy after first deploy

### Step 4: Configure Network

1. **Port:** Set to `80` ⚠️ **NOT 5173!**
2. **Protocol:** `https`
3. **Domain:** DC Deploy will assign one, or configure custom domain

### Step 5: Configure Infrastructure

1. **Region:** Select your preferred region (e.g., India)
2. **Machine Type:** Select based on your needs (e.g., DCD-1)

### Step 6: Deploy

1. Click "Deploy" or "Save & Deploy"
2. Monitor build logs
3. Wait for build to complete
4. Verify container starts successfully

---

## 🔍 Verification

### Check Build Logs

Look for:
- ✅ `✓ built in X.XXs` - Build succeeded
- ✅ All dist files listed
- ✅ Image pushed successfully

### Check Container Logs

After deployment, check logs:
- ✅ Nginx should start: `Configuration complete; ready for start up`
- ✅ Worker process started: `start worker process 24`
- ❌ If you see SIGQUIT signals, there's a port mismatch or health check issue

### Test Frontend

1. Visit the frontend URL assigned by DC Deploy
2. Check browser console for errors
3. Verify API calls work (check Network tab)
4. Test `/health` endpoint: `https://your-frontend-url/health`

---

## 🐛 Troubleshooting

### Container Keeps Restarting

**Symptom:** Logs show SIGQUIT, container shuts down and restarts

**Possible Causes:**

1. **Port Mismatch** (Most Common)
   - ❌ Frontend port set to `5173`
   - ✅ Should be `80`
   - **Fix:** Change port to `80` in DC Deploy settings

2. **Health Check Failing**
   - Backend might not be accessible
   - Check backend URL is correct
   - Verify backend is running

3. **Resource Limits**
   - Container might be hitting CPU/memory limits
   - Check DC Deploy resource configuration

### API Calls Not Working

**Symptom:** Frontend loads but API calls fail

**Causes:**

1. **Wrong API URL**
   - Check `VITE_API_URL` build argument
   - Should be: `https://your-backend-url/api` (with `/api` suffix)
   - Verify backend CORS allows frontend domain

2. **Build Arguments Not Set**
   - If `VITE_API_URL` wasn't set during build, it will use default `http://localhost:3001`
   - This won't work in production
   - **Fix:** Set build arguments and rebuild

### Build Fails

**Symptom:** Build errors in logs

**Common Issues:**

1. **Missing package-lock.json**
   - ✅ Should be committed to repo
   - Dockerfile has fallback logic

2. **Export/Import Errors**
   - ✅ Should be fixed already
   - Check that all services use default exports

---

## 📝 Quick Configuration Checklist

### Frontend Service
- [ ] Port set to **80** (not 5173)
- [ ] Protocol: **https**
- [ ] Context: `./frontend`
- [ ] Dockerfile: `./Dockerfile`
- [ ] Build Arguments set:
  - [ ] `VITE_API_URL` = `https://your-backend-url/api`
  - [ ] `VITE_FRONTEND_URL` = `https://your-frontend-url`
  - [ ] `VITE_CASHFREE_APP_ID` = (your app ID)
  - [ ] `VITE_CASHFREE_MODE` = `sandbox`
- [ ] **NO** `VITE_*` variables in runtime Environment Variables section
- [ ] Auto Deploy enabled (optional)
- [ ] Health check configured: `/health`

---

## 🔄 After Configuration

1. **Rebuild the service** with new settings
2. **Monitor build logs** for errors
3. **Check container logs** after deployment
4. **Test the frontend** URL
5. **Verify API connectivity** from frontend

---

## 📚 Reference

- **Dockerfile:** `frontend/Dockerfile`
- **Nginx Port:** 80 (hardcoded in Dockerfile)
- **Build Arguments:** Required for Vite variables
- **Health Endpoint:** `/health`

---

**Last Updated:** 2024-11-25  
**Status:** ✅ Ready for DC Deploy Configuration


