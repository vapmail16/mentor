# 🚀 Quick Local Setup - Update .env File

## ✅ What's Already Done

1. ✅ Port 3001 freed (process killed)
2. ✅ Local database `mentor_platform` created
3. ✅ Database schema applied (all tables created)

## 📝 Update backend/.env File

Open `backend/.env` and **change these 6 lines**:

### Change FROM (remote database):
```env
DB_HOST=database-9gzu6ya5n8.tcp-proxy-2212.dcdeploy.cloud
DB_PORT=30090
DB_NAME=database-db
DB_USER=MNKgZI
DB_PASSWORD="#+2nVXX#YW"
DB_SSL=false
```

### Change TO (local database):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mentor_platform
DB_USER=user
DB_PASSWORD=
DB_SSL=false
```

## 🔑 Update JWT_SECRET (if needed)

If JWT_SECRET is missing or too short (< 32 chars), update it:
```env
JWT_SECRET=FXcGcss82SVnjKc7cbk6Ui+NJHdEhBHditRAFBDPXiE=
```

(Or generate a new one: `openssl rand -base64 32`)

## ▶️ Start Backend

```bash
cd backend
npm run dev
```

You should see:
- ✅ `Database connected successfully`
- ✅ Server listening on port 3001

## ✅ Test

Open another terminal:
```bash
curl http://localhost:3001/api/health
```

Should return: `{"status":"ok","database":"connected",...}`

---

**That's it! Your backend should now work locally.** 🎉
