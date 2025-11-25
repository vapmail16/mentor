# New Project Template Checklist

**Use this checklist when starting a new project based on the Mentor Platform development approach.**

---

## 📋 Phase 1: Planning & Setup

### Project Structure
- [ ] Create project directory structure
  - [ ] `backend/` folder
  - [ ] `frontend/` folder
  - [ ] `database/` folder
  - [ ] `docs/` folder
- [ ] Initialize `.gitignore` (include `.env`, `node_modules`, etc.)
- [ ] Create main `README.md`

### Documentation
- [ ] Create `docs/` folder
- [ ] Document initial requirements
- [ ] Create `docs/PROJECT_STATUS.md` to track progress

---

## 📋 Phase 2: Database Design

### Schema Design
- [ ] Identify all entities
- [ ] Define relationships between entities
- [ ] Design primary keys (use UUIDs)
- [ ] Add foreign key constraints
- [ ] Define indexes on frequently queried columns
- [ ] Add CHECK constraints for status fields
- [ ] Add `created_at` and `updated_at` to all tables

### Schema Implementation
- [ ] Create `database/schema.sql` file
- [ ] Create triggers for `updated_at` timestamps
- [ ] Create functions if needed
- [ ] Test schema locally
- [ ] Document schema in `docs/`

---

## 📋 Phase 3: Backend Setup

### Initial Setup
- [ ] Initialize Node.js project (`npm init -y`)
- [ ] Install core dependencies:
  - [ ] `express`
  - [ ] `pg` (PostgreSQL client)
  - [ ] `dotenv`
  - [ ] `cors`
  - [ ] `helmet`
  - [ ] `cookie-parser`
- [ ] Install development dependencies:
  - [ ] `jest`
  - [ ] `supertest`
  - [ ] `nodemon`

### Project Structure
- [ ] Create `config/` folder → `database.js`
- [ ] Create `middleware/` folder:
  - [ ] `auth.middleware.js`
  - [ ] `errorHandler.js`
  - [ ] `validation.js`
  - [ ] `requestId.js`
- [ ] Create `routes/` folder
- [ ] Create `services/` folder
- [ ] Create `utils/` folder:
  - [ ] `logger.js`
  - [ ] `authCookies.js`
- [ ] Create `tests/` folder structure

### Configuration
- [ ] Create `backend/.env.example` file
- [ ] Create `backend/.env` file (local development)
- [ ] Set up database connection in `config/database.js`
- [ ] Configure logging in `utils/logger.js`
- [ ] Create `server.js` entry point

### Core Implementation
- [ ] Implement authentication service
- [ ] Implement authentication routes
- [ ] Add authentication middleware
- [ ] Add error handling middleware
- [ ] Add input validation middleware

---

## 📋 Phase 4: Frontend Setup

### Initial Setup
- [ ] Initialize React project (Vite + TypeScript)
- [ ] Install core dependencies:
  - [ ] `react-router-dom`
  - [ ] `axios`
- [ ] Install UI dependencies (if using a library)
- [ ] Install development dependencies:
  - [ ] `vitest`
  - [ ] `@testing-library/react`

### Project Structure
- [ ] Create `src/components/ui/` folder
- [ ] Create `src/pages/` folder
- [ ] Create `src/services/api/` folder
- [ ] Create `src/contexts/` folder
- [ ] Create `src/config/` folder
- [ ] Create `src/test/` folder

### Configuration
- [ ] Create `frontend/.env.example` file
- [ ] Create `frontend/.env` file (local development)
- [ ] Set up API service layer
- [ ] Configure HTTP client (axios)

### Core Implementation
- [ ] Create authentication context
- [ ] Implement authentication pages (Login, Register)
- [ ] Implement protected route wrapper
- [ ] Create main App component with routing

---

## 📋 Phase 5: Security Implementation

### Authentication & Authorization
- [ ] Implement password hashing (bcrypt)
- [ ] Implement JWT token generation
- [ ] Implement JWT token verification
- [ ] Set up secure cookie storage
- [ ] Implement role-based access control (RBAC)

### Input Validation
- [ ] Add validation for all user inputs
- [ ] Use Joi or similar validation library
- [ ] Validate email formats
- [ ] Enforce password strength requirements
- [ ] Sanitize user input (XSS prevention)

### Database Security
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Validate all database inputs
- [ ] Set up proper database permissions

### API Security
- [ ] Add rate limiting middleware
- [ ] Configure CORS properly
- [ ] Use Helmet for security headers
- [ ] Implement request ID tracking
- [ ] Set up error handling (don't expose sensitive info)

---

## 📋 Phase 6: Testing Setup

### Backend Testing
- [ ] Configure Jest
- [ ] Create test setup file
- [ ] Create test helpers/utilities
- [ ] Set up test database configuration
- [ ] Write unit tests for services
- [ ] Write integration tests for routes
- [ ] Write E2E tests for critical flows

### Frontend Testing
- [ ] Configure Vitest
- [ ] Create test setup file
- [ ] Create test utilities (custom render)
- [ ] Write component tests
- [ ] Write page tests
- [ ] Write service tests

### Test Coverage
- [ ] Aim for 100% test pass rate
- [ ] Test all error cases
- [ ] Test edge cases
- [ ] Document test results

---

## 📋 Phase 7: Feature Development

### For Each Feature:
- [ ] Design database schema changes (if needed)
- [ ] Update database schema
- [ ] Create service layer functions
- [ ] Create route handlers
- [ ] Add input validation
- [ ] Add authentication/authorization
- [ ] Write tests
- [ ] Update frontend API service
- [ ] Create frontend components
- [ ] Integrate frontend with backend
- [ ] Test end-to-end flow
- [ ] Document the feature

---

## 📋 Phase 8: Database Migration

### Migration Planning
- [ ] Document current database state
- [ ] Plan migration steps
- [ ] Create migration scripts
- [ ] Test migration on staging environment

### Migration Execution
- [ ] Backup existing database
- [ ] Export schema
- [ ] Export data
- [ ] Import to new database
- [ ] Verify data integrity
- [ ] Update connection strings
- [ ] Run tests to verify
- [ ] Update documentation

---

## 📋 Phase 9: Documentation

### Code Documentation
- [ ] Document all API endpoints
- [ ] Add JSDoc comments to complex functions
- [ ] Document database schema
- [ ] Create API documentation

### Project Documentation
- [ ] Update `README.md` with setup instructions
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Create development guide
- [ ] Document testing approach

---

## 📋 Phase 10: Deployment Preparation

### Docker Setup
- [ ] Create `backend/Dockerfile`
- [ ] Create `frontend/Dockerfile`
- [ ] Create `backend/.dockerignore`
- [ ] Create `frontend/.dockerignore`
- [ ] Create `docker-compose.yml` (for local testing)
- [ ] Test Docker builds locally

### Docker Configuration
- [ ] Configure multi-stage builds for optimization
- [ ] Set up health checks in Dockerfiles
- [ ] Configure non-root users for security
- [ ] Set up proper signal handling
- [ ] **CRITICAL:** Create writable directories (e.g., logs) BEFORE USER switch
- [ ] **CRITICAL:** Set proper ownership (`chown`) for writable directories
- [ ] **CRITICAL:** Ensure `package-lock.json` files are committed (NOT in `.gitignore`)
- [ ] **CRITICAL:** Add fallback logic in Dockerfiles: generate lock file if missing
- [ ] **CRITICAL:** Match Node version in Dockerfile to package.json requirements
- [ ] Test containers locally before deploying

### Environment Configuration
- [ ] Set up production environment variables
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure domain names

### DC Deploy / Platform Setup
- [ ] Create backend service in deployment platform
- [ ] Create frontend service in deployment platform
- [ ] Configure build settings (Dockerfile paths)
- [ ] Set environment variables in platform
- [ ] Configure build arguments for frontend
- [ ] Set up health checks in platform
- [ ] Configure resource limits (CPU, memory)
- [ ] Set up custom domains/subdomains

### Security Review
- [ ] Review all environment variables
- [ ] Verify all secrets are secured (marked as secrets in platform)
- [ ] Review authentication implementation
- [ ] Review authorization rules
- [ ] Check for exposed secrets in code
- [ ] **CRITICAL:** Verify NO actual API keys in documentation files (use placeholders)
- [ ] **CRITICAL:** Check all files before committing with `git diff --cached`
- [ ] Verify .dockerignore excludes sensitive files

### Performance
- [ ] Optimize database queries
- [ ] Add missing indexes
- [ ] Review slow queries
- [ ] Set up monitoring
- [ ] Configure CDN for frontend (if applicable)
- [ ] Enable Gzip compression

### Testing
- [ ] Run full test suite
- [ ] Verify all tests pass
- [ ] **CRITICAL:** Test Docker builds locally before pushing
- [ ] **CRITICAL:** Test frontend build: `cd frontend && npm run build`
- [ ] **CRITICAL:** Test backend container startup: `docker run --env-file .env`
- [ ] **CRITICAL:** Test frontend container startup: `docker run`
- [ ] Verify all export/import patterns are consistent
- [ ] Test containers locally
- [ ] Test in staging environment
- [ ] Perform security testing
- [ ] Test health check endpoints

---

## 📋 Phase 11: Git & Version Control

### Repository Setup
- [ ] Initialize git repository
- [ ] Create `.gitignore` file
- [ ] **CRITICAL:** Verify `package-lock.json` is NOT in `.gitignore` (must be committed)
- [ ] Add remote repository
- [ ] Create initial commit
- [ ] **CRITICAL:** Review all files before committing (no sensitive data in docs)
- [ ] Push to GitHub/GitLab

### Branching Strategy
- [ ] Create `main` branch
- [ ] Create `develop` branch (optional)
- [ ] Use feature branches for new work
- [ ] Use descriptive commit messages

---

## 📋 Phase 12: Final Checks

### Code Quality
- [ ] Run linter
- [ ] Fix all linting errors
- [ ] Review code for best practices
- [ ] Remove unused code
- [ ] Remove console.logs (use logger)

### Testing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Test all user flows manually

### Documentation
- [ ] README is up to date
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment instructions clear

### Security
- [ ] No secrets in code
- [ ] All inputs validated
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] Rate limiting configured

---

## 📋 Quick Reference Commands

### Backend
```bash
# Install dependencies
cd backend && npm install

# Run development server
npm run dev

# Run tests
NODE_OPTIONS=--experimental-vm-modules npm test
```

### Frontend
```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev

# Run tests
npm test
```

### Database
```bash
# Run schema
psql -h localhost -U user -d database_name < database/schema.sql

# Connect to database
psql -h localhost -U user -d database_name
```

---

## 📋 Best Practices Reminder

✅ **DO:**
- Plan before coding
- Security from day one
- Test as you build
- Document everything
- Use environment variables
- Validate all inputs
- Handle errors gracefully
- Use transactions for multi-step operations

❌ **DON'T:**
- Skip planning
- Add security later
- Skip tests
- Hardcode credentials
- Trust user input
- Ignore errors
- Skip documentation

---

---

## 📋 Phase 13: Critical Deployment Lessons Learned

### Docker Build Issues
- [ ] **VERIFIED:** `package-lock.json` files are committed (NOT in `.gitignore`)
- [ ] **VERIFIED:** Dockerfiles have fallback logic for missing lock files
- [ ] **VERIFIED:** All writable directories created BEFORE USER switch
- [ ] **VERIFIED:** Proper ownership set for writable directories

### Frontend Build Issues
- [ ] **VERIFIED:** All service files use consistent export pattern (default exports)
- [ ] **VERIFIED:** All imports use index file, not direct service imports
- [ ] **VERIFIED:** Frontend build succeeds locally: `npm run build`
- [ ] **VERIFIED:** Node version in Dockerfile matches package.json requirements

### Runtime Issues
- [ ] **VERIFIED:** Backend container starts successfully with test `.env`
- [ ] **VERIFIED:** Logs directory permissions are correct
- [ ] **VERIFIED:** All environment variables are set correctly

### Security Issues
- [ ] **VERIFIED:** NO actual API keys in documentation files
- [ ] **VERIFIED:** All documentation uses placeholders
- [ ] **VERIFIED:** All secrets are in `.env` files (which are in `.gitignore`)

---

## 📋 Deployment Checklist Summary

### Pre-Deployment
1. ✅ All tests passing
2. ✅ Docker builds succeed locally
3. ✅ Containers start successfully locally
4. ✅ Frontend build succeeds
5. ✅ No sensitive data in documentation
6. ✅ All lock files committed
7. ✅ Export/import patterns consistent

### Deployment
1. ✅ Environment variables configured in platform
2. ✅ Build arguments set correctly
3. ✅ Health checks configured
4. ✅ Resource limits set appropriately

### Post-Deployment
1. ✅ Health check endpoints responding
2. ✅ Application accessible
3. ✅ API endpoints working
4. ✅ Frontend-backend integration working

---

**Use this checklist for every new project to ensure consistency and quality!**

---

**Created:** 2024-11-25  
**Last Updated:** 2024-11-25  
**Based on:** AI-Powered Mentor Learning Platform Development Experience  
**Critical Lessons:** 6 deployment issues documented and resolved

