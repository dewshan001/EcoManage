# EcoManage Test Setup & Execution Guide

**Last Updated:** April 29, 2026  
**Version:** 1.0

## Quick Start

```bash
# Install dependencies
npm install --save-dev jest supertest

# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## Prerequisites

### System Requirements
- **Node.js:** v14.0+
- **npm:** v6.0+
- **Database:** SQLite3
- **Port:** 5000 (for backend server)

### Environment Setup

#### 1. Create `.env.test` file

```bash
# Backend
PORT=5000
ECOMANAGE_DB_PATH=./ecomanage-test.db
NODE_ENV=test

# Authentication (for testing)
ADMIN_TOKEN=test-admin-token-12345
USER_TOKEN=test-user-token-12345
MANAGER_TOKEN=test-manager-token-12345

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=5m
RATE_LIMIT_MAX_REQUESTS=10
```

#### 2. Install Dependencies

```bash
# Navigate to backend
cd backend
npm install

# Install test dependencies
npm install --save-dev jest supertest @babel/preset-env babel-jest

# Navigate to frontend
cd ../frontend
npm install

# Install test dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

#### 3. Jest Configuration

Create `backend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'routes/**/*.js',
    'db/**/*.js',
    'server.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

Create `frontend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};
```

---

## Database Setup for Testing

### 1. Test Database Initialization

```bash
# Create test database (auto-created on first run)
# Set ECOMANAGE_DB_PATH=./ecomanage-test.db in .env.test

# Clear test database between test suites
npm test -- --clearCache
```

### 2. Database Reset Script

Create `tests/setup.js`:

```javascript
const { getDB, initDB } = require('./backend/db/database');

beforeAll(async () => {
  // Initialize test database
  await initDB();
  console.log('Test database initialized');
});

afterEach(async () => {
  // Clean up test data (optional)
  const db = getDB();
  // Truncate test tables
  await db.run('DELETE FROM Reports WHERE location LIKE "%test%"');
  await db.run('DELETE FROM Tasks WHERE reportId > 0');
  await db.run('DELETE FROM Invoices WHERE taskId > 0');
});

afterAll(async () => {
  const db = getDB();
  if (db) {
    await db.close();
  }
});
```

---

## Test Execution Strategies

### 1. Unit Tests Only

```bash
# Run backend unit tests
npm test -- tests/backend/unit/

# Run specific unit test file
npm test -- auth.test.js
npm test -- reports.test.js
npm test -- tasks-billing.test.js
npm test -- vehicles.test.js
npm test -- database.test.js
```

### 2. Integration Tests Only

```bash
# Run all integration tests
npm test -- tests/backend/integration/

# Run resident workflows
npm test -- resident-workflow.test.js

# Run admin workflows
npm test -- admin-workflow.test.js
```

### 3. Full Test Suite

```bash
# Run all tests with coverage report
npm test -- --coverage --verbose

# Output coverage to HTML
npm test -- --coverage --coverageReporters=html
```

### 4. Watch Mode (Development)

```bash
# Watch mode - re-runs tests on file change
npm test -- --watch

# Watch + coverage
npm test -- --watch --coverage
```

---

## Test Execution Order

### Recommended Test Flow:

1. **Phase 1: Setup Validation** (5 min)
   - Database initialization test
   - Schema migration verification
   - Constraint enforcement

2. **Phase 2: Unit Tests** (15 min)
   - Authentication tests
   - Report CRUD tests
   - Task management tests
   - Billing tests
   - Vehicle management tests

3. **Phase 3: Integration Tests** (20 min)
   - Resident complete workflow
   - Admin operations workflow
   - Authorization tests
   - Error handling tests

4. **Phase 4: Performance Tests** (5 min)
   - Large dataset handling
   - Pagination tests
   - Rate limiting verification

**Total Estimated Runtime:** ~45 minutes

---

## Testing Authentication

### Mock Tokens

For testing, use these token formats:

```javascript
// Admin token
const adminToken = 'Bearer test-admin-token-12345';

// Resident token
const userToken = 'Bearer test-user-token-12345';

// Manager token
const managerToken = 'Bearer test-manager-token-12345';
```

### Testing Role-Based Access

```javascript
// In test file
const request = require('supertest');
const app = require('../backend/server');

describe('Authorization Tests', () => {
  it('should allow admin to access protected route', async () => {
    const response = await request(app)
      .get('/api/auth/managers')
      .set('Authorization', 'Bearer test-admin-token-12345');
    
    expect(response.status).toBe(200);
  });

  it('should deny resident from admin-only route', async () => {
    const response = await request(app)
      .get('/api/auth/managers')
      .set('Authorization', 'Bearer test-user-token-12345');
    
    expect(response.status).toBe(403);
  });
});
```

---

## Debugging Tests

### 1. Verbose Output

```bash
npm test -- --verbose
```

### 2. Debug Single Test

```bash
# Run specific test with detailed output
npm test -- --testNamePattern="AUTH-01" --verbose
```

### 3. Node Debugger

```bash
# Use Node debugger
node --inspect-brk ./node_modules/.bin/jest --runInBand tests/backend/unit/auth.test.js
```

### 4. Console Logs in Tests

```javascript
describe('Debug Example', () => {
  it('should debug output', () => {
    console.log('Debug information');
    console.log({ data: 'value' });
    expect(true).toBe(true);
  });
});
```

---

## Troubleshooting

### Issue: Database Locked

**Solution:**
```bash
# Close any open connections
# Remove test database file
rm ecomanage-test.db

# Re-run tests (will create fresh DB)
npm test
```

### Issue: Port Already in Use

**Solution:**
```bash
# Change port in .env.test
PORT=5001

# Or kill process using port
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000    # Windows
```

### Issue: Tests Timeout

**Solution:**
```javascript
// In test file, increase timeout
jest.setTimeout(30000); // 30 seconds

// Or in jest.config.js
testTimeout: 30000
```

### Issue: Import Errors

**Solution:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run unit tests
        run: npm test -- tests/backend/unit/ --coverage
      
      - name: Run integration tests
        run: npm test -- tests/backend/integration/
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Performance Benchmarks

### Expected Test Execution Times

| Test Suite | Expected Duration | Status |
|-----------|------------------|--------|
| Unit Tests (Auth) | 2-3 sec | PASS |
| Unit Tests (Reports) | 3-4 sec | PASS |
| Unit Tests (Tasks/Billing) | 4-5 sec | PASS |
| Unit Tests (Vehicles) | 2-3 sec | PASS |
| Unit Tests (Database) | 2-3 sec | PASS |
| Integration Tests (Resident) | 5-10 sec | PASS |
| Integration Tests (Admin) | 5-10 sec | PASS |
| **Total Suite** | **25-35 sec** | **PASS** |

### Coverage Goals

```
Statements   : 80%+
Branches     : 75%+
Functions    : 80%+
Lines        : 80%+
```

---

## Test Documentation

### Running Tests from VS Code

1. **Install Jest Extension**
   - Search: "Jest"
   - Install: "Jest Runner" by Orta Therox

2. **Run Individual Tests**
   - Click "Run" above test name
   - Click "Debug" for debugging

3. **View Coverage**
   - Run: `npm test -- --coverage`
   - View: `coverage/lcov-report/index.html`

### Test Reports

Generate HTML test report:

```bash
npm test -- --reporter=html

# View report
open ./reports/index.html  # macOS
start ./reports/index.html # Windows
xdg-open ./reports/index.html # Linux
```

---

## Best Practices

### 1. Test Isolation
```javascript
// ✓ Good: Isolated test
describe('Auth Tests', () => {
  let db;
  
  beforeEach(() => {
    db = getTestDatabase();
  });
  
  afterEach(() => {
    db.close();
  });
  
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

### 2. Descriptive Test Names
```javascript
// ✓ Good
it('should reject registration with non-Gmail email', () => {});

// ✗ Bad
it('test registration', () => {});
```

### 3. Arrange-Act-Assert Pattern
```javascript
// ✓ Good
it('should create invoice', () => {
  // Arrange
  const invoice = { taskId: 1, residentId: 1, taskType: 'General Waste' };
  
  // Act
  const result = createInvoice(invoice);
  
  // Assert
  expect(result.invoiceId).toBeDefined();
});
```

### 4. Mock External Services
```javascript
// ✓ Good: Mock image upload
jest.mock('../utils/imageUpload', () => ({
  upload: jest.fn().mockResolvedValue('mock-url')
}));
```

---

## Continuous Monitoring

### Coverage Tracking

```bash
# Generate coverage report
npm test -- --coverage

# Track coverage over time
npm test -- --coverage --coverageReporters=json

# View HTML report
open coverage/lcov-report/index.html
```

### Test Metrics

Monitor:
- Test execution time
- Coverage percentage
- Failed test count
- Flaky test identification

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Node.js Testing Best Practices](https://nodejs.org/en/docs/guides/testing/)
- [EcoManage Test Cases](./docs/TEST_CASES.md)

---

## Contact & Support

For test execution issues:
1. Check troubleshooting section
2. Review test logs
3. Check GitHub Actions workflow logs
4. Contact QA team

**Test Suite Maintained By:** QA Team  
**Last Updated:** April 29, 2026
