/**
 * Backend Unit Tests - Database & Audit
 * File: tests/backend/unit/database.test.js
 * 
 * Tests for database initialization, constraints, audit logging
 * 
 * Run tests: npm test -- database.test.js
 */

const { getDB, initDB } = require('../../../backend/db/database');
const { logAuditAction, getAuditLogsForUser, getAllAuditLogs, getAuditLogsByDateRange } = require('../../../backend/db/auditLog');

describe('Database & Audit Tests', () => {
  let db;

  beforeAll(async () => {
    // Initialize database for testing
    await initDB();
    db = getDB();
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  /**
   * DB-01: Database Initialization on Startup
   */
  describe('DB-01: Database Initialization', () => {
    it('should have all required tables after initialization', async () => {
      const tables = [
        'Users',
        'Workers',
        'Reports',
        'Tasks',
        'Vehicles',
        'Invoices',
        'AuditLogs'
      ];

      for (const table of tables) {
        const result = await db.get(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [table]
        );
        expect(result).toBeDefined();
        expect(result.name).toBe(table);
      }
    });
  });

  /**
   * DB-02: Schema Migration - Add Missing Columns
   */
  describe('DB-02: Schema Migration', () => {
    it('should have userId column in Reports table', async () => {
      const result = await db.all(
        `PRAGMA table_info(Reports)`
      );
      const userIdColumn = result.find(col => col.name === 'userId');
      expect(userIdColumn).toBeDefined();
    });

    it('should have linkedTaskId column in Reports table', async () => {
      const result = await db.all(
        `PRAGMA table_info(Reports)`
      );
      const linkedTaskIdColumn = result.find(col => col.name === 'linkedTaskId');
      expect(linkedTaskIdColumn).toBeDefined();
    });

    it('should have assignedTo column in Tasks table', async () => {
      const result = await db.all(
        `PRAGMA table_info(Tasks)`
      );
      const assignedToColumn = result.find(col => col.name === 'assignedTo');
      expect(assignedToColumn).toBeDefined();
    });

    it('should have assignedVehicle column in Tasks table', async () => {
      const result = await db.all(
        `PRAGMA table_info(Tasks)`
      );
      const assignedVehicleColumn = result.find(col => col.name === 'assignedVehicle');
      expect(assignedVehicleColumn).toBeDefined();
    });
  });

  /**
   * DB-03: Email Unique Constraint
   */
  describe('DB-03: Email Unique Constraint', () => {
    beforeEach(async () => {
      // Clean up test data
      await db.run('DELETE FROM Users WHERE email LIKE ?', ['%constraint-test%']);
    });

    afterEach(async () => {
      await db.run('DELETE FROM Users WHERE email LIKE ?', ['%constraint-test%']);
    });

    it('should enforce UNIQUE constraint on Users.email', async () => {
      const email = 'constraint-test@gmail.com';

      // Insert first user
      await db.run(
        'INSERT INTO Users (fullName, email, password, role) VALUES (?, ?, ?, ?)',
        ['User One', email, 'hashed_password_1', 'Resident']
      );

      // Attempt to insert duplicate email
      const insertDuplicate = db.run(
        'INSERT INTO Users (fullName, email, password, role) VALUES (?, ?, ?, ?)',
        ['User Two', email, 'hashed_password_2', 'Resident']
      );

      await expect(insertDuplicate).rejects.toThrow(/UNIQUE|constraint/i);
    });
  });

  /**
   * DB-04: reportId Unique Constraint
   */
  describe('DB-04: reportId Unique Constraint', () => {
    beforeEach(async () => {
      await db.run('DELETE FROM Reports WHERE reportId LIKE ?', ['REP-CONSTRAINT-%']);
    });

    afterEach(async () => {
      await db.run('DELETE FROM Reports WHERE reportId LIKE ?', ['REP-CONSTRAINT-%']);
    });

    it('should enforce UNIQUE constraint on Reports.reportId', async () => {
      const reportId = 'REP-CONSTRAINT-001';

      // Insert first report
      await db.run(
        'INSERT INTO Reports (reportId, userId, location, description, status) VALUES (?, ?, ?, ?, ?)',
        [reportId, 1, 'Block A', 'Test description', 'Pending']
      );

      // Attempt to insert duplicate reportId
      const insertDuplicate = db.run(
        'INSERT INTO Reports (reportId, userId, location, description, status) VALUES (?, ?, ?, ?, ?)',
        [reportId, 2, 'Block B', 'Another description', 'Pending']
      );

      await expect(insertDuplicate).rejects.toThrow(/UNIQUE|constraint/i);
    });
  });

  /**
   * DB-05: Audit Log - Log User Creation
   */
  describe('DB-05: Audit Log - Log User Creation', () => {
    beforeEach(async () => {
      await db.run('DELETE FROM AuditLogs WHERE targetType = ?', ['User']);
    });

    afterEach(async () => {
      await db.run('DELETE FROM AuditLogs WHERE targetType = ?', ['User']);
    });

    it('should log user creation action', async () => {
      const adminId = 1;
      const targetId = 999;
      const changes = { fullName: 'New Manager', email: 'manager@gmail.com', role: 'GarbageManager' };

      await logAuditAction(adminId, 'CREATE_USER', 'User', targetId, changes);

      // Verify log entry
      const logEntry = await db.get(
        'SELECT * FROM AuditLogs WHERE adminId = ? AND action = ? AND targetId = ?',
        [adminId, 'CREATE_USER', targetId]
      );

      expect(logEntry).toBeDefined();
      expect(logEntry.action).toBe('CREATE_USER');
      expect(logEntry.targetType).toBe('User');
      expect(logEntry.adminId).toBe(adminId);
    });
  });

  /**
   * DB-06: Audit Log - Retrieve Logs for User
   */
  describe('DB-06: Audit Log - Retrieve Logs for User', () => {
    beforeEach(async () => {
      await db.run('DELETE FROM AuditLogs WHERE targetId = ?', [999]);

      // Create multiple audit logs
      for (let i = 0; i < 3; i++) {
        await logAuditAction(1, 'UPDATE_USER', 'User', 999, { update: i });
      }
    });

    afterEach(async () => {
      await db.run('DELETE FROM AuditLogs WHERE targetId = ?', [999]);
    });

    it('should retrieve audit logs for specific user', async () => {
      const logs = await getAuditLogsForUser(999, 10);

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      logs.forEach(log => {
        expect(log.targetId).toBe(999);
      });
    });

    it('should limit returned logs', async () => {
      const logs = await getAuditLogsForUser(999, 1);

      expect(logs.length).toBeLessThanOrEqual(1);
    });
  });

  /**
   * DB-07: Audit Log - Date Range Filter
   */
  describe('DB-07: Audit Log - Date Range Filter', () => {
    beforeEach(async () => {
      await db.run('DELETE FROM AuditLogs WHERE createdAt LIKE ?', ['2026-04%']);

      // Create audit logs with specific dates
      await db.run(
        'INSERT INTO AuditLogs (adminId, action, targetType, targetId, changes, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [1, 'TEST_ACTION', 'User', 1, '{}', '2026-04-15T10:00:00Z']
      );
    });

    afterEach(async () => {
      await db.run('DELETE FROM AuditLogs WHERE createdAt LIKE ?', ['2026-04%']);
    });

    it('should filter logs by date range', async () => {
      const logs = await getAuditLogsByDateRange('2026-04-01', '2026-04-30');

      expect(Array.isArray(logs)).toBe(true);
      // Verify all logs are within date range
      logs.forEach(log => {
        const logDate = new Date(log.createdAt).toISOString().split('T')[0];
        expect(logDate).toMatch(/2026-04-/);
      });
    });

    it('should return empty for date range outside logs', async () => {
      const logs = await getAuditLogsByDateRange('2026-01-01', '2026-03-31');

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBe(0);
    });
  });

  /**
   * DB-08: Audit Log - All Logs (Paginated)
   */
  describe('DB-08: Audit Log - Pagination', () => {
    beforeEach(async () => {
      await db.run('DELETE FROM AuditLogs WHERE targetType = ?', ['Test']);

      // Create multiple test logs
      for (let i = 0; i < 5; i++) {
        await db.run(
          'INSERT INTO AuditLogs (adminId, action, targetType, targetId, changes) VALUES (?, ?, ?, ?, ?)',
          [1, 'TEST_ACTION', 'Test', i, '{}']
        );
      }
    });

    afterEach(async () => {
      await db.run('DELETE FROM AuditLogs WHERE targetType = ?', ['Test']);
    });

    it('should retrieve paginated logs', async () => {
      const page1 = await getAllAuditLogs(2, 0);
      const page2 = await getAllAuditLogs(2, 2);

      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);

      // Verify pagination offset works
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id);
      }
    });

    it('should return all logs when limit exceeds total', async () => {
      const allLogs = await getAllAuditLogs(100, 0);

      expect(Array.isArray(allLogs)).toBe(true);
    });
  });

  /**
   * DB - Data Integrity Tests
   */
  describe('DB - Data Integrity', () => {
    it('should maintain foreign key relationships', async () => {
      // This test verifies that linked data maintains integrity
      const userId = 1;

      // Create a report
      const insertReportResult = await db.run(
        'INSERT INTO Reports (reportId, userId, location, description, status) VALUES (?, ?, ?, ?, ?)',
        ['REP-INTEGRITY-001', userId, 'Test Block', 'Integrity test', 'Pending']
      );

      // Link a task
      const insertTaskResult = await db.run(
        'INSERT INTO Tasks (reportId, priority, status) VALUES (?, ?, ?)',
        [insertReportResult.lastID, 'High', 'Pending']
      );

      // Verify relationship
      const report = await db.get(
        'SELECT * FROM Reports WHERE id = ?',
        [insertReportResult.lastID]
      );

      const task = await db.get(
        'SELECT * FROM Tasks WHERE reportId = ?',
        [insertReportResult.lastID]
      );

      expect(report).toBeDefined();
      expect(task).toBeDefined();
      expect(task.reportId).toBe(report.id);
    });
  });
});
