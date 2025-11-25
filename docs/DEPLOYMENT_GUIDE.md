# Deployment Guide: DC Deploy

**Platform:** DC Deploy Cloud  
**Purpose:** Complete guide for deploying the Mentor Platform to production

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [DC Deploy Setup](#2-dc-deploy-setup)
3. [Backend Deployment](#3-backend-deployment)
4. [Frontend Deployment](#4-frontend-deployment)
5. [Environment Configuration](#5-environment-configuration)
6. [Database Configuration](#6-database-configuration)
7. [Deployment Steps](#7-deployment-steps)
8. [Health Checks](#8-health-checks)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

### Required Accounts
- ✅ DC Deploy account
- ✅ GitHub repository access
- ✅ Remote database credentials
- ✅ Domain names (if using custom domains)

### Required Information
- Database connection string
- JWT secret
- API keys (Resend, Cashfree, OpenAI)
- Frontend and backend URLs

---

## 2. DC Deploy Setup

### 2.1 Initial Setup

1. **Login to DC Deploy**
   - Access DC Deploy dashboard
   - Navigate to your project/organization

2. **Connect GitHub Repository**
   - Go to repository settings
   - Connect your GitHub account
   - Select repository: `vapmail16/mentor`

3. **Create Two Services**
   - **Service 1:** Backend (Node.js)
   - **Service 2:** Frontend (Nginx)

---

## 3. Backend Deployment

### 3.1 Dockerfile Overview

The backend Dockerfile uses a multi-stage build:
- **Stage 1:** Installs production dependencies
- **Stage 2:** Creates lightweight production image

**Key Features:**
- Uses Node.js 18 Alpine (smaller image)
- Non-root user for security
- Health check endpoint
- Signal handling with dumb-init

### 3.2 Backend Service Configuration

#### Build Configuration
- **Dockerfile Path:** `backend/Dockerfile`
- **Context:** `backend/`
- **Build Command:** (auto-detected from Dockerfile)

#### Runtime Configuration
- **Port:** `3001` (DC Deploy will map this)
- **Health Check:** `/api/health`
- **Environment Variables:** (see section 5)

#### Resource Limits (Recommended)
- **CPU:** 0.5-1 CPU
- **Memory:** 512MB-1GB
- **Instances:** 1-2 (for redundancy)

### 3.3 Environment Variables for Backend

Set these in DC Deploy's environment variables:

```env
NODE_ENV=production
PORT=3001

# Database
DB_HOST=database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud
DB_PORT=30090
DB_NAME=database-db
DB_USER=MNKgZI
DB_PASSWORD=your-database-password-here
DB_SSL=false

# JWT
JWT_SECRET=<your-128-char-secret>
JWT_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=your-resend-api-key-here
RESEND_FROM=noreply@mentorplatform.com

# Payment (Cashfree)
CASHFREE_APP_ID=your-cashfree-app-id-here
CASHFREE_SECRET_KEY=your-cashfree-secret-key-here

# AI (OpenAI)
OPENAI_API_KEY=your-openai-api-key-here

# URLs
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://api.your-domain.com
```

---

## 4. Frontend Deployment

### 4.1 Dockerfile Overview

The frontend Dockerfile uses a multi-stage build:
- **Stage 1:** Builds the React app with Vite
- **Stage 2:** Serves with Nginx

**Key Features:**
- Nginx for efficient static file serving
- SPA routing support
- Gzip compression
- Security headers
- Static asset caching

### 4.2 Frontend Service Configuration

#### Build Configuration
- **Dockerfile Path:** `frontend/Dockerfile`
- **Context:** `frontend/`
- **Build Arguments:**
  ```
  VITE_API_URL=https://api.your-domain.com/api
  VITE_FRONTEND_URL=https://your-frontend-domain.com
  VITE_CASHFREE_APP_ID=TEST10848247ba007d82db4dc78223f674284801
  VITE_CASHFREE_MODE=sandbox
  ```

#### Runtime Configuration
- **Port:** `80` (Nginx default)
- **Health Check:** `/health`
- **Static Files:** Served from `/usr/share/nginx/html`

#### Resource Limits (Recommended)
- **CPU:** 0.25-0.5 CPU
- **Memory:** 256MB-512MB
- **Instances:** 1-2 (for redundancy)

### 4.3 Environment Variables for Frontend

**Important:** Frontend environment variables must be set at **build time** (as build arguments), not runtime, since Vite embeds them during build.

#### Build Arguments (DC Deploy Build Settings)
```
VITE_API_URL=https://api.your-domain.com/api
VITE_FRONTEND_URL=https://your-frontend-domain.com
VITE_CASHFREE_APP_ID=TEST10848247ba007d82db4dc78223f674284801
VITE_CASHFREE_MODE=sandbox
```

---

## 5. Environment Configuration

### 5.1 Setting Environment Variables in DC Deploy

1. **Navigate to Service Settings**
   - Go to your service (Backend or Frontend)
   - Click on "Environment Variables" or "Config"

2. **Add Variables**
   - For Backend: Add all runtime variables
   - For Frontend: Add as build arguments

3. **Secret Management**
   - Mark sensitive variables as "Secret" in DC Deploy
   - Never commit secrets to Git

### 5.2 Environment Variable Checklist

#### Backend Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- [ ] `DB_SSL=false` (or `true` if SSL required)
- [ ] `JWT_SECRET` (128+ characters)
- [ ] `RESEND_API_KEY`
- [ ] `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `FRONTEND_URL`, `BACKEND_URL`

#### Frontend Build Arguments
- [ ] `VITE_API_URL` (must be full URL with protocol)
- [ ] `VITE_FRONTEND_URL`
- [ ] `VITE_CASHFREE_APP_ID`
- [ ] `VITE_CASHFREE_MODE`

---

## 6. Database Configuration

### 6.1 Database Connection

The application is already configured to use the remote database:
- **Host:** `database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud`
- **Port:** `30090`
- **Database:** `database-db`
- **User:** `MNKgZI`

### 6.2 Database SSL Configuration

If DC Deploy requires SSL for database connections:
```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false  # For cloud databases without CA cert
```

---

## 7. Deployment Steps

### Step 1: Prepare Repository
```bash
# Ensure all changes are committed and pushed
git add .
git commit -m "Add Dockerfiles for deployment"
git push origin main
```

### Step 2: Create Backend Service in DC Deploy

1. **Create New Service**
   - Name: `mentor-backend`
   - Type: Docker

2. **Configure Build**
   - Source: GitHub repository
   - Branch: `main`
   - Dockerfile Path: `backend/Dockerfile`
   - Build Context: `backend/`

3. **Configure Environment Variables**
   - Add all backend environment variables from section 5.2

4. **Configure Resources**
   - Set CPU and memory limits
   - Configure auto-scaling (optional)

5. **Configure Networking**
   - Set port: `3001`
   - Configure domain/subdomain

6. **Deploy**
   - Click "Deploy" or enable auto-deploy
   - Monitor build logs

### Step 3: Create Frontend Service in DC Deploy

1. **Create New Service**
   - Name: `mentor-frontend`
   - Type: Docker

2. **Configure Build**
   - Source: GitHub repository
   - Branch: `main`
   - Dockerfile Path: `frontend/Dockerfile`
   - Build Context: `frontend/`

3. **Configure Build Arguments**
   - Add all frontend build arguments from section 5.2
   - **Important:** These must match your backend URL

4. **Configure Resources**
   - Set CPU and memory limits

5. **Configure Networking**
   - Set port: `80`
   - Configure domain/subdomain

6. **Deploy**
   - Click "Deploy"
   - Monitor build logs

### Step 4: Verify Deployment

1. **Check Backend Health**
   ```bash
   curl https://api.your-domain.com/api/health
   ```
   Expected: `{"status":"ok","database":"connected"}`

2. **Check Frontend Health**
   ```bash
   curl https://your-frontend-domain.com/health
   ```
   Expected: `healthy`

3. **Test Full Flow**
   - Visit frontend URL
   - Test user registration
   - Test login
   - Verify API calls work

---

## 8. Health Checks

### 8.1 Backend Health Check

**Endpoint:** `GET /api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-11-25T10:00:00.000Z"
}
```

**DC Deploy Configuration:**
- **Path:** `/api/health`
- **Interval:** 30 seconds
- **Timeout:** 3 seconds
- **Failure Threshold:** 3

### 8.2 Frontend Health Check

**Endpoint:** `GET /health`

**Expected Response:**
```
healthy
```

**DC Deploy Configuration:**
- **Path:** `/health`
- **Interval:** 30 seconds
- **Timeout:** 3 seconds
- **Failure Threshold:** 3

---

## 9. Troubleshooting

### Common Issues

#### Issue 1: Backend Fails to Start
**Symptoms:** Container exits immediately

**Solutions:**
- Check environment variables are set correctly
- Verify database connection (test with `psql`)
- Check logs: `dc-deploy logs mentor-backend`
- Verify JWT_SECRET is set and long enough

#### Issue 2: Frontend Shows API Errors
**Symptoms:** Network errors in browser console

**Solutions:**
- Verify `VITE_API_URL` matches backend URL exactly
- Check CORS settings in backend
- Ensure backend is accessible from frontend domain
- Check browser console for specific errors

#### Issue 3: Database Connection Fails
**Symptoms:** Backend logs show database errors

**Solutions:**
- Verify database credentials
- Check network connectivity (DC Deploy → Database)
- Test connection string manually
- Verify DB_SSL setting matches database requirements

#### Issue 4: Build Fails
**Symptoms:** Docker build errors

**Solutions:**
- Check Dockerfile syntax
- Verify all files are in repository
- Check build logs for specific errors
- Ensure .dockerignore is not excluding needed files

### Debugging Commands

#### View Backend Logs
```bash
# In DC Deploy dashboard
# Go to service → Logs
```

#### Test Backend Locally
```bash
cd backend
docker build -t mentor-backend .
docker run -p 3001:3001 --env-file .env mentor-backend
```

#### Test Frontend Locally
```bash
cd frontend
docker build \
  --build-arg VITE_API_URL=http://localhost:3001/api \
  --build-arg VITE_FRONTEND_URL=http://localhost:5173 \
  -t mentor-frontend .
docker run -p 80:80 mentor-frontend
```

---

## 10. Post-Deployment Checklist

### Backend
- [ ] Health check endpoint responding
- [ ] Database connection working
- [ ] Authentication endpoints working
- [ ] API endpoints accessible
- [ ] Logs are being collected
- [ ] Error handling working

### Frontend
- [ ] Frontend loads correctly
- [ ] API calls to backend working
- [ ] Authentication flow working
- [ ] Static assets loading
- [ ] SPA routing working
- [ ] No console errors

### Integration
- [ ] User can register
- [ ] User can login
- [ ] Protected routes work
- [ ] Payments working (if applicable)
- [ ] Email sending working (if applicable)

---

## 11. Critical Learning: Frontend Completeness Verification

### 🚨 **CRITICAL LESSON: Always Verify Frontend Completeness Before Deployment**

**The Problem:**
A common mistake is deploying when only authentication pages are complete, leaving core user-facing features missing. This leads to:
- Backend APIs ready but no UI to use them
- Broken user experience (dashboard links pointing to non-existent routes)
- Users unable to access core features despite paying subscriptions
- Deployment fails acceptance testing immediately

**What Happened in This Project:**
- ✅ Backend: 95% complete with all APIs implemented
- ✅ Authentication: Login, Register, Dashboard, Pricing pages complete
- ❌ **Core Features Missing**: Session viewing, Session browsing, Learning paths, Video player, Comments/Q&A, Search, Mentor profiles, etc.
- ❌ Dashboard had links to routes that didn't exist (`/sessions`, `/learning-paths`)

**Impact:**
- Frontend was only 30% complete
- Users couldn't actually use the platform they subscribed to
- MVP launch blocked

**Verification Checklist Before Deployment:**

#### Frontend Completeness Verification
- [ ] **All Dashboard Links Work**
  - Verify every link in Dashboard page has a corresponding route
  - Test navigation flow end-to-end
  - Check that all "Quick Actions" buttons navigate to real pages

- [ ] **Core User Flows Complete**
  - [ ] User can browse sessions (`/sessions`)
  - [ ] User can view a session (`/sessions/:id`)
  - [ ] User can watch videos (video player works)
  - [ ] User can access transcripts, summaries
  - [ ] User can interact (comments, Q&A)
  - [ ] User can browse learning paths
  - [ ] User can search content

- [ ] **API Integration Verified**
  - [ ] All backend API endpoints have corresponding frontend pages
  - [ ] API service functions exist for all endpoints
  - [ ] Error handling implemented for all API calls
  - [ ] Loading states shown during API calls

- [ ] **Component Completeness**
  - [ ] All reusable components created (VideoPlayer, AudioPlayer, etc.)
  - [ ] All page components implemented
  - [ ] All forms functional with validation
  - [ ] All modals/dialogs working

**How to Verify:**
1. Create a test matrix mapping every backend API endpoint to a frontend page/component
2. Manually test every user flow from login to core feature usage
3. Verify no broken links or 404 errors
4. Ensure all routes defined in `App.tsx` have corresponding page components

**Pre-Deployment Test:**
```bash
# Run frontend tests
cd frontend && npm test

# Start dev server and manually verify:
# 1. Login → Dashboard
# 2. Click every link in Dashboard
# 3. Navigate to every route
# 4. Test every core feature
```

**Documentation:**
- Maintain a `FRONTEND_ROUTES.md` file listing all routes and their status
- Keep `API_ENDPOINTS.md` listing all backend APIs
- Verify coverage: Frontend pages should cover 90%+ of backend endpoints

**This lesson must be documented and followed for all future projects!**

---

## 12. Continuous Deployment

### Auto-Deploy Setup

1. **Enable Auto-Deploy in DC Deploy**
   - Go to service settings
   - Enable "Auto Deploy"
   - Select branch: `main`

2. **Deployment Triggers**
   - Automatically deploys on push to `main`
   - Manual deployment also available

3. **Deployment Notifications**
   - Configure email/Slack notifications
   - Monitor deployment status

---

## 12. Monitoring and Maintenance

### Logs
- **Backend:** Check DC Deploy logs for errors
- **Frontend:** Check browser console and network tab
- **Database:** Monitor connection pools and slow queries

### Performance
- Monitor response times
- Check resource usage (CPU, memory)
- Monitor database query performance

### Security
- Regularly rotate secrets
- Monitor for security vulnerabilities
- Keep dependencies updated

---

## 13. Rollback Procedure

If deployment fails:

1. **In DC Deploy Dashboard**
   - Navigate to service
   - Go to "Deployments" or "History"
   - Select previous successful deployment
   - Click "Rollback" or "Redeploy"

2. **Manual Rollback**
   ```bash
   # Tag previous version
   git checkout <previous-commit-hash>
   git push origin main --force  # Only if needed
   ```

---

## Quick Reference

### Backend Service
- **Port:** 3001
- **Health:** `/api/health`
- **Dockerfile:** `backend/Dockerfile`

### Frontend Service
- **Port:** 80
- **Health:** `/health`
- **Dockerfile:** `frontend/Dockerfile`

### Environment Variables
- See section 5.2 for complete list
- Backend: Runtime variables
- Frontend: Build arguments

---

**Last Updated:** 2024-11-25  
**Platform:** DC Deploy  
**Status:** Ready for Production Deployment ✅

