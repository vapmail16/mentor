# Testing Documentation

## Test Setup

The project includes comprehensive testing infrastructure:

### Test Types

1. **Unit Tests** (`tests/unit/`)
   - Service-level tests with mocked dependencies
   - Fast execution, isolated components

2. **Integration Tests** (`tests/integration/`)
   - Tests API endpoints with database
   - Tests complete request/response cycles

3. **E2E Tests** (`tests/e2e/`)
   - Complete user flows
   - Multi-step scenarios

4. **System Tests** (`tests/system/`)
   - API availability tests
   - Configuration tests

### Test Configuration

- **Jest** as test runner
- **Supertest** for HTTP endpoint testing
- Test database: `mentor_platform`
- Test timeout: 15 seconds

### Running Tests

```bash
# Run all tests
cd backend
npm test

# Run specific test file
npm test -- auth.integration.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Files Created

#### Unit Tests
- `tests/unit/auth.service.test.js` - Auth service unit tests

#### Integration Tests
- `tests/integration/auth.integration.test.js` - Complete auth flow
- `tests/integration/sessions.integration.test.js` - Session management
- `tests/integration/health.integration.test.js` - Health check

#### E2E Tests
- `tests/e2e/auth-flow.e2e.test.js` - Complete authentication journey
- `tests/e2e/subscription-flow.e2e.test.js` - Subscription purchase flow

#### System Tests
- `tests/system/api.test.js` - API availability checks
- `tests/health.test.js` - Basic health check

### Environment Variables for Tests

Create `backend/.env.test`:

```env
NODE_ENV=test
DB_HOST=localhost
DB_NAME=mentor_platform
DB_USER=user
DB_PASSWORD=
JWT_SECRET=test-secret-key-minimum-32-characters-long
```

### Database Setup for Testing

The tests use the same database as development. Before running tests:

```bash
# Ensure database is created and schema is applied
psql -U user -d postgres -c "CREATE DATABASE mentor_platform;"
psql -U user -d mentor_platform -f database/schema.sql
```

### Test Coverage

Run with coverage report:

```bash
npm test -- --coverage
```

Coverage reports are generated in `coverage/` directory.

### Continuous Integration

Tests are designed to run in CI/CD pipelines. Ensure:

1. PostgreSQL is available
2. Environment variables are set
3. Database schema is applied

### Test Best Practices

1. **Cleanup**: Tests clean up test data after execution
2. **Isolation**: Each test is independent
3. **Mocking**: External services are mocked
4. **Real Database**: Integration tests use real database

### Known Limitations

- Payment tests require Cashfree credentials (mocked)
- Email tests require Resend API key (mocked)
- AI service tests require OpenAI API key (mocked)

### Adding New Tests

1. Place unit tests in `tests/unit/`
2. Place integration tests in `tests/integration/`
3. Place E2E tests in `tests/e2e/`
4. Follow naming convention: `*.test.js`

### Example Test

```javascript
import request from 'supertest';
import app from '../../server.js';

describe('My Feature Tests', () => {
  it('should test feature', async () => {
    const res = await request(app)
      .get('/api/my-endpoint');
    
    expect(res.status).toBe(200);
  });
});
```

