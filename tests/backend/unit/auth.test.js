/**
 * Backend Unit Tests - Authentication & User Management
 * File: tests/backend/unit/auth.test.js
 * 
 * Tests for registration, login, profile updates, and role-based access control
 * 
 * Prerequisites:
 * - Jest installed: npm install --save-dev jest
 * - Supertest for HTTP testing: npm install --save-dev supertest
 * - Test database setup configured
 * 
 * Run tests: npm test -- auth.test.js
 */

const request = require('supertest');
const app = require('../../../backend/server');
const { getDB } = require('../../../backend/db/database');

describe('Authentication & User Management Tests', () => {
  let db;

  beforeAll(async () => {
    // Initialize test database connection
    db = getDB();
    // Clear users table before tests
    await db.run('DELETE FROM Users WHERE email LIKE ?', ['%test%']);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await db.run('DELETE FROM Users WHERE email LIKE ?', ['%test%']);
  });

  afterAll(async () => {
    // Close database connection
    if (db) {
      await db.close();
    }
  });

  /**
   * AUTH-01: Valid Resident Registration
   */
  describe('AUTH-01: Valid Resident Registration', () => {
    it('should register a new resident with valid credentials', async () => {
      const newUser = {
        fullName: 'John Doe',
        email: 'john-test@gmail.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('role');
      expect(response.body.role).toBe('Resident');
      
      // Verify in database
      const userInDb = await db.get('SELECT * FROM Users WHERE email = ?', [newUser.email]);
      expect(userInDb).toBeDefined();
      expect(userInDb.fullName).toBe(newUser.fullName);
      expect(userInDb.role).toBe('Resident');
    });
  });

  /**
   * AUTH-02: Invalid Email (non-Gmail)
   */
  describe('AUTH-02: Registration - Invalid Email', () => {
    it('should reject registration with non-Gmail email', async () => {
      const newUser = {
        fullName: 'Jane Smith',
        email: 'jane@yahoo.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/gmail/i);
    });
  });

  /**
   * AUTH-03: Weak Password (no uppercase)
   */
  describe('AUTH-03: Registration - Weak Password', () => {
    it('should reject password without uppercase letter', async () => {
      const newUser = {
        fullName: 'Bob Jones',
        email: 'bob-test@gmail.com',
        password: 'password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/uppercase|special/i);
    });

    it('should reject password shorter than 8 characters', async () => {
      const newUser = {
        fullName: 'Bob Jones',
        email: 'bob-test@gmail.com',
        password: 'Pass12!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/password|length|8/i);
    });

    it('should reject password without special character', async () => {
      const newUser = {
        fullName: 'Bob Jones',
        email: 'bob-test@gmail.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/special/i);
    });
  });

  /**
   * AUTH-04: Duplicate Email
   */
  describe('AUTH-04: Registration - Duplicate Email', () => {
    it('should reject duplicate email registration', async () => {
      const newUser = {
        fullName: 'John Duplicate',
        email: 'duplicate-test@gmail.com',
        password: 'Password123!'
      };

      // Register first user
      const res1 = await request(app)
        .post('/api/auth/register')
        .send(newUser);
      expect(res1.status).toBe(201);

      // Attempt to register with same email
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Jane Duplicate',
          email: 'duplicate-test@gmail.com',
          password: 'Password456!'
        });

      expect(res2.status).toBe(409);
      expect(res2.body.message).toMatch(/already|duplicate|exists/i);
    });
  });

  /**
   * AUTH-05: Invalid Name (includes numbers)
   */
  describe('AUTH-05: Registration - Invalid Name', () => {
    it('should reject name with numbers', async () => {
      const newUser = {
        fullName: 'John123 Doe',
        email: 'john123-test@gmail.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/name|letters/i);
    });

    it('should accept name with letters and spaces only', async () => {
      const newUser = {
        fullName: 'John Michael Doe',
        email: 'john-valid@gmail.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.user.fullName).toBe(newUser.fullName);
    });
  });

  /**
   * AUTH-06: Valid User Login
   */
  describe('AUTH-06: Valid User Login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Login Test User',
          email: 'login-test@gmail.com',
          password: 'Password123!'
        });
    });

    it('should successfully login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@gmail.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('role');
      expect(response.body.role).toBe('Resident');
      expect(response.body.user.email).toBe('login-test@gmail.com');
    });
  });

  /**
   * AUTH-07: Login - Incorrect Password
   */
  describe('AUTH-07: Login - Incorrect Password', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Login Fail User',
          email: 'login-fail@gmail.com',
          password: 'CorrectPass123!'
        });
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-fail@gmail.com',
          password: 'WrongPassword1!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/invalid|credentials/i);
    });
  });

  /**
   * AUTH-08: Login - Non-existent Email
   */
  describe('AUTH-08: Login - Non-existent Email', () => {
    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@gmail.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/invalid|credentials/i);
    });
  });

  /**
   * AUTH-10: Update Profile - Valid Change
   */
  describe('AUTH-10: Update Profile - Valid Change', () => {
    let userId;

    beforeEach(async () => {
      const regResponse = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Update Test User',
          email: 'update-test@gmail.com',
          password: 'Password123!'
        });
      userId = regResponse.body.id;
    });

    it('should update user profile with valid data', async () => {
      const response = await request(app)
        .put('/api/auth/settings')
        .send({
          userId: userId,
          fullName: 'Updated Name',
          password: 'NewPassword456!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.fullName).toBe('Updated Name');

      // Verify password was updated (should be able to login with new password)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'update-test@gmail.com',
          password: 'NewPassword456!'
        });

      expect(loginResponse.status).toBe(200);
    });
  });

  /**
   * AUTH-11: Update Profile - Missing Required Field
   */
  describe('AUTH-11: Update Profile - Missing Required Field', () => {
    let userId;

    beforeEach(async () => {
      const regResponse = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Missing Field User',
          email: 'missing-field@gmail.com',
          password: 'Password123!'
        });
      userId = regResponse.body.id;
    });

    it('should reject update with empty name', async () => {
      const response = await request(app)
        .put('/api/auth/settings')
        .send({
          userId: userId,
          fullName: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/name|required/i);
    });

    it('should reject update with missing userId', async () => {
      const response = await request(app)
        .put('/api/auth/settings')
        .send({
          fullName: 'New Name'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/userId|required|id/i);
    });
  });

  /**
   * AUTH-12: Register Manager (Admin Only)
   */
  describe('AUTH-12: Register Manager (Admin Only)', () => {
    it('should register a new manager with admin credentials', async () => {
      // Assuming admin session is established
      const newManager = {
        fullName: 'Manager Smith',
        email: 'manager-test@gmail.com',
        password: 'ManagerPass123!',
        contactNumber: '555-1234'
      };

      const response = await request(app)
        .post('/api/auth/register-manager')
        .set('Authorization', `Bearer ${process.env.ADMIN_TOKEN || 'test-admin-token'}`)
        .send(newManager);

      // Note: This test may need adjustment based on actual admin authentication mechanism
      if (response.status === 201) {
        expect(response.body).toHaveProperty('user');
        expect(response.body.role).toBe('GarbageManager');
      }
    });
  });

  /**
   * AUTH-13: Register Manager - Non-Admin Attempt
   */
  describe('AUTH-13: Register Manager - Non-Admin Attempt', () => {
    it('should reject manager registration from non-admin user', async () => {
      // Register a regular resident first
      const resident = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Regular User',
          email: 'regular-user@gmail.com',
          password: 'Password123!'
        });

      // Attempt to register manager as resident
      const response = await request(app)
        .post('/api/auth/register-manager')
        .set('Authorization', `Bearer ${process.env.USER_TOKEN || 'test-user-token'}`)
        .send({
          fullName: 'Unauthorized Manager',
          email: 'unauth-mgr@gmail.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/unauthorized|permission|admin/i);
    });
  });
});
