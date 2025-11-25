# Local Database Setup Guide

This guide helps you set up a local PostgreSQL database for development.

---

## 🚀 Quick Setup

### Option 1: Use Existing Local PostgreSQL (Recommended)

If you already have PostgreSQL installed:

1. **Create a local database:**
   ```bash
   psql -U $(whoami) postgres
   ```
   Then in psql:
   ```sql
   CREATE DATABASE mentor_platform;
   \q
   ```

2. **Update `backend/.env` for local development:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mentor_platform
   DB_USER=your_local_user  # Usually your system username
   DB_PASSWORD=             # Leave empty if no password set
   DB_SSL=false
   ```

3. **Run migrations:**
   ```bash
   cd backend
   psql -U your_local_user -d mentor_platform -f database/schema.sql
   ```

---

### Option 2: Use Remote Database for Development

If you want to use the remote database for local development (current setup):

The `.env` file is already configured for remote database:
```env
DB_HOST=database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud
DB_PORT=30090
DB_NAME=database-db
DB_USER=MNKgZI
DB_PASSWORD="#+2nVXX#YW"
DB_SSL=false
```

**Check connection:**
```bash
psql "postgresql://MNKgZI:#+2nVXX#YW@database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud:30090/database-db"
```

If connection fails, the remote database might be:
- Not accessible from your IP
- Temporarily unavailable
- Requiring different credentials

---

## 🔧 Troubleshooting

### Error: `FATAL: role "postgres" does not exist`

**Problem:** Your PostgreSQL installation doesn't have a `postgres` role.

**Solution:**
1. Find your PostgreSQL user (usually your system username):
   ```bash
   whoami
   ```
   
2. Use that user instead:
   ```bash
   psql -U $(whoami) postgres
   ```

3. Update `backend/.env`:
   ```env
   DB_USER=your_system_username
   ```

---

### Error: `FATAL: database "mentor_platform" does not exist`

**Problem:** The database hasn't been created yet.

**Solution:**
1. Connect to PostgreSQL:
   ```bash
   psql -U your_username postgres
   ```

2. Create the database:
   ```sql
   CREATE DATABASE mentor_platform;
   \q
   ```

3. Run the schema:
   ```bash
   psql -U your_username -d mentor_platform -f backend/database/schema.sql
   ```

---

### Error: `FATAL: password authentication failed`

**Problem:** Wrong password or user.

**Solution:**
1. Try connecting without password (if allowed):
   ```bash
   psql -U your_username -d mentor_platform
   ```

2. If that works, leave `DB_PASSWORD` empty in `.env`:
   ```env
   DB_PASSWORD=
   ```

3. Or set a password for your PostgreSQL user:
   ```sql
   ALTER USER your_username WITH PASSWORD 'your_password';
   ```

---

### Error: `FATAL: database "database-db" does not exist` (Remote Database)

**Problem:** Remote database connection issue.

**Solutions:**
1. **Check if you can reach the remote database:**
   ```bash
   telnet database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud 30090
   ```

2. **Test connection with psql:**
   ```bash
   psql "postgresql://MNKgZI:#+2nVXX#YW@database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud:30090/database-db"
   ```

3. **Use local database instead:**
   - Switch to Option 1 above
   - Create local database
   - Update `.env` to use local settings

---

## 📝 Recommended Setup for Local Development

Create a **local development environment**:

1. **Create local database:**
   ```bash
   psql -U $(whoami) postgres
   ```
   ```sql
   CREATE DATABASE mentor_platform;
   \q
   ```

2. **Create `backend/.env.local` (or update `.env`):**
   ```env
   NODE_ENV=development
   PORT=3001
   
   # Local Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mentor_platform
   DB_USER=$(whoami)  # Replace with your username
   DB_PASSWORD=
   DB_SSL=false
   
   # JWT
   JWT_SECRET=your-local-dev-secret-min-32-characters-long
   JWT_EXPIRES_IN=7d
   
   # API Keys (use test/sandbox keys for local dev)
   RESEND_API_KEY=your-resend-api-key-here
   CASHFREE_APP_ID=your-cashfree-app-id-here
   CASHFREE_SECRET_KEY=your-cashfree-secret-key-here
   OPENAI_API_KEY=your-openai-api-key-here
   
   # URLs
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:3001
   ```

3. **Run schema:**
   ```bash
   cd backend
   psql -U $(whoami) -d mentor_platform -f database/schema.sql
   ```

4. **Start backend:**
   ```bash
   npm run dev
   ```

---

## ✅ Verification

After setup, test the connection:

```bash
cd backend
node -e "
import('dotenv').then(dotenv => {
  dotenv.config();
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);
});
"
```

Or simply try starting the server:
```bash
npm run dev
```

If you see `Database connected successfully` in the logs, you're good to go! ✅

---

**Last Updated:** 2024-11-25


