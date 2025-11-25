# AI-Powered Mentor Learning Platform

A comprehensive learning platform featuring AI-powered content processing, multilingual support, learning paths, gamification, and community interaction.

## 🚀 Features

- **AI-Powered Content Processing**: Transcripts, translations, summaries, and key learnings
- **Multilingual Support**: Multiple languages with English translations
- **Learning Paths & Certificates**: Structured learning with certification
- **Community Interaction**: Comments, Q&A, and live sessions
- **Gamification**: Badges, streaks, and achievements
- **Payment Integration**: Cashfree payment gateway
- **Email Service**: Resend for transactional emails
- **Comprehensive Testing**: 100% test pass rate (36/36 tests)

## 📋 Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** (remote cloud database)
- **JWT** authentication
- **Jest** for testing

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Vitest** for testing

## 🗄️ Database

The application uses a remote PostgreSQL database with 25 tables including:
- Users, Mentors, Sessions
- Learning Paths, Certificates
- Comments, Q&A
- Gamification (Badges, Streaks)
- Subscriptions, Analytics

## ⚙️ Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL client
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Update with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env  # Update with your configuration
npm run dev
```

### Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories for required environment variables.

## 🧪 Testing

### Backend Tests
```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npm test
```
✅ **23/23 tests passing (100%)**

### Frontend Tests
```bash
cd frontend
npm test -- --run
```
✅ **13/13 tests passing (100%)**

## 📚 Documentation

All documentation is available in the `docs/` folder:
- `docs/README.md` - Documentation index
- `docs/MIGRATION_FINAL_STATUS.md` - Database migration status
- `docs/TEST_100_PERCENT_ACHIEVED.md` - Test results

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- Secure cookie handling

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Sessions
- `GET /api/sessions` - List sessions
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create session (mentor only)

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/webhook` - Payment webhook

See route files in `backend/routes/` for complete API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests to ensure everything passes
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🔗 Links

- **Repository**: https://github.com/vapmail16/mentor.git
- **Backend**: Express.js + PostgreSQL
- **Frontend**: React + TypeScript

---

**Status**: ✅ Production Ready  
**Tests**: ✅ 100% Passing (36/36)  
**Database**: ✅ Remote PostgreSQL (25 tables)

