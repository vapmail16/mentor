# Local Development Guide

This guide explains how to run the frontend and backend servers locally for development.

---

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended for Testing)
```bash
# Make sure .env files are configured
docker-compose up
```

### Option 2: Running Servers Separately (Recommended for Development)

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **PostgreSQL** client (for database access)
- Environment variables configured (see below)

---

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create or update `backend/.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud
DB_PORT=30090
DB_NAME=database-db
DB_USER=MNKgZI
DB_PASSWORD="#+2nVXX#YW"
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_min_64_characters_long_for_security
JWT_EXPIRES_IN=7d

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=noreply@mentorplatform.com

# Payment Gateway (Cashfree)
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key

# AI Service (OpenAI)
OPENAI_API_KEY=your_openai_api_key

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
```

### 4. Start Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The backend server will start on **http://localhost:3001**

### 5. Verify Backend is Running

Open your browser or use curl:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-11-25T..."
}
```

---

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create or update `frontend/.env` file with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Frontend URL
VITE_FRONTEND_URL=http://localhost:5173

# Payment Gateway (Cashfree)
VITE_CASHFREE_APP_ID=your_cashfree_app_id
VITE_CASHFREE_MODE=sandbox
```

**Important Notes:**
- Vite requires `VITE_` prefix for environment variables
- These are **build-time** variables (embedded during build)
- For development, they're read from `.env` file
- Changes to `.env` require restarting the dev server

### 4. Start Frontend Development Server

```bash
npm run dev
```

The frontend server will start on **http://localhost:5173**

### 5. Verify Frontend is Running

Open your browser:
```
http://localhost:5173
```

You should see the Mentor Platform landing page.

---

## 🏃 Running Both Servers

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

---

## 📝 Available Scripts

### Backend Scripts
```bash
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run database migrations
npm run migrate

# Initialize badges (first time setup)
npm run init:badges
```

### Frontend Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run linter
npm run lint
```

---

## 🔍 Troubleshooting

### Backend Won't Start

1. **Check Environment Variables**
   ```bash
   # Make sure .env file exists and has all required variables
   cat backend/.env
   ```

2. **Check Database Connection**
   ```bash
   # Test database connection
   psql -h database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud \
        -p 30090 \
        -U MNKgZI \
        -d database-db
   ```

3. **Check Port Availability**
   ```bash
   # Check if port 3001 is in use
   lsof -i :3001
   # Kill process if needed
   kill -9 <PID>
   ```

4. **Check Logs**
   - Backend logs are in `backend/logs/` directory
   - Check `combined.log` or `error.log`

### Frontend Won't Start

1. **Check Environment Variables**
   ```bash
   # Make sure .env file exists
   cat frontend/.env
   ```

2. **Check Node Version**
   ```bash
   node --version  # Should be v18 or higher
   ```

3. **Clear Cache and Reinstall**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check Port Availability**
   ```bash
   # Check if port 5173 is in use
   lsof -i :5173
   # Kill process if needed
   kill -9 <PID>
   ```

### API Connection Issues

1. **Check Backend URL in Frontend**
   - Make sure `VITE_API_URL` in `frontend/.env` matches backend URL
   - Should be: `http://localhost:3001/api`

2. **Check CORS Settings**
   - Backend CORS should allow `http://localhost:5173`
   - Check `backend/server.js` for CORS configuration

3. **Check Network Tab**
   - Open browser DevTools → Network tab
   - Look for failed API requests
   - Check error messages

---

## 🐳 Using Docker Compose

### Start All Services
```bash
# From project root
docker-compose up
```

### Start in Background
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
```

### Rebuild After Changes
```bash
docker-compose up --build
```

---

## 🔗 Default URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Backend Health Check**: http://localhost:3001/api/health

---

## ✅ Verification Checklist

### Backend
- [ ] Environment variables configured in `backend/.env`
- [ ] Database connection working
- [ ] Server starts without errors
- [ ] Health check endpoint responds: `curl http://localhost:3001/api/health`

### Frontend
- [ ] Environment variables configured in `frontend/.env`
- [ ] Dev server starts without errors
- [ ] Frontend loads in browser: http://localhost:5173
- [ ] API calls work (check browser Network tab)

### Integration
- [ ] Can register a new user
- [ ] Can login
- [ ] Protected routes work
- [ ] API calls return expected data

---

## 📚 Additional Resources

- **Backend API Routes**: See `backend/routes/` directory
- **Frontend Components**: See `frontend/src/components/` directory
- **Testing**: See `docs/TESTING.md`
- **Deployment**: See `docs/DEPLOYMENT_GUIDE.md`

---

## 🆘 Getting Help

If you encounter issues:

1. Check the logs:
   - Backend: `backend/logs/error.log`
   - Frontend: Browser console (F12)

2. Verify environment variables are set correctly

3. Make sure both servers are running

4. Check that ports 3001 and 5173 are not in use

5. Review the troubleshooting section above

---

**Last Updated**: 2024-11-25  
**Status**: ✅ Ready for Local Development


