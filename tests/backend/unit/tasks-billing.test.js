/**
 * Backend Unit Tests - Tasks & Billing
 * File: tests/backend/unit/tasks-billing.test.js
 * 
 * Tests for task creation, status progression, invoicing, and payment workflows
 * 
 * Run tests: npm test -- tasks-billing.test.js
 */

const request = require('supertest');
const app = require('../../../backend/server');
const { getDB } = require('../../../backend/db/database');

describe('Tasks & Billing Management Tests', () => {
  let db;
  let adminToken = process.env.ADMIN_TOKEN || 'test-admin-token';

  beforeAll(async () => {
    db = getDB();
    await db.run('DELETE FROM Tasks WHERE reportId > 0');
    await db.run('DELETE FROM Invoices WHERE taskId > 0');
  });

  afterEach(async () => {
    await db.run('DELETE FROM Tasks WHERE reportId > 0');
    await db.run('DELETE FROM Invoices WHERE taskId > 0');
  });

  // ============= TASKS TESTS =============

  /**
   * TASK-01: Create Task from Report
   */
  describe('TASK-01: Create Task from Report', () => {
    it('should create a new task with valid data', async () => {
      const newTask = {
        reportId: 1,
        priority: 'High',
        scheduleDate: '2026-05-20',
        workers: 'W001',
        vehicleType: 'Compactor Truck'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTask);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('taskId');
      expect(response.body.taskId).toMatch(/^TSK-/);

      // Verify in database
      const taskInDb = await db.get(
        'SELECT * FROM Tasks WHERE taskId = ?',
        [response.body.taskId]
      );
      expect(taskInDb).toBeDefined();
      expect(taskInDb.status).toBe('Pending');
      expect(taskInDb.priority).toBe('High');
    });
  });

  /**
   * TASK-03: Update Task Status - Progression
   */
  describe('TASK-03: Update Task Status Progression', () => {
    let taskId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: 1,
          priority: 'Medium',
          scheduleDate: '2026-05-20',
          workers: 'W001',
          vehicleType: 'Mini Loader'
        });
      taskId = createResponse.body.taskId;
    });

    it('should update task from Pending to Pending Worker', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Pending Worker',
          assignedTo: 'W001'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/updated|success/i);

      // Verify in database
      const taskInDb = await db.get('SELECT * FROM Tasks WHERE taskId = ?', [taskId]);
      expect(taskInDb.status).toBe('Pending Worker');
      expect(taskInDb.assignedTo).toBe('W001');
    });
  });

  /**
   * TASK-04: Mark Task Complete (Auto-Invoice)
   */
  describe('TASK-04: Mark Task Complete - Auto-Invoice', () => {
    let taskId;
    let reportId;

    beforeEach(async () => {
      // Create task with linked report
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: 1,
          priority: 'High',
          scheduleDate: '2026-05-20',
          workers: 'W001',
          vehicleType: 'Compactor Truck'
        });
      taskId = createResponse.body.taskId;
      reportId = 1;
    });

    it('should change task status to Pending Invoice on completion', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Completed'
        });

      expect(response.status).toBe(200);

      // Verify task status
      const taskInDb = await db.get('SELECT * FROM Tasks WHERE taskId = ?', [taskId]);
      expect(taskInDb.status).toBe('Pending Invoice');
    });
  });

  /**
   * TASK-06: Assign Vehicle to Task
   */
  describe('TASK-06: Assign Vehicle to Task', () => {
    let taskId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: 1,
          priority: 'Medium',
          scheduleDate: '2026-05-20',
          workers: 'W001'
        });
      taskId = createResponse.body.taskId;
    });

    it('should assign vehicle to task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assignedVehicle: 'VH-001'
        });

      expect(response.status).toBe(200);

      // Verify in database
      const taskInDb = await db.get('SELECT * FROM Tasks WHERE taskId = ?', [taskId]);
      expect(taskInDb.assignedVehicle).toBe('VH-001');
    });
  });

  /**
   * TASK-07: Get All Tasks Joined with Report Data
   */
  describe('TASK-07: Get All Tasks with Report Data', () => {
    it('should retrieve all tasks with joined report data', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  /**
   * TASK-09: Delete Task
   */
  describe('TASK-09: Delete Task', () => {
    let taskId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: 1,
          priority: 'Low',
          scheduleDate: '2026-05-25'
        });
      taskId = createResponse.body.taskId;
    });

    it('should delete task by admin', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/deleted/i);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  // ============= BILLING TESTS =============

  /**
   * BILL-01: Create Invoice from Task
   */
  describe('BILL-01: Create Invoice from Task', () => {
    it('should create invoice with custom fees', async () => {
      const invoice = {
        taskId: 1,
        residentId: 1,
        taskType: 'Bulk Waste',
        wasteFee: 50,
        laborFee: 30,
        vehicleFee: 40
      };

      const response = await request(app)
        .post('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invoice);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('invoiceId');
      expect(response.body.invoiceId).toMatch(/^INV-/);
      expect(response.body.invoice.total).toBe(120); // 50+30+40

      // Verify task status updated
      const taskInDb = await db.get('SELECT * FROM Tasks WHERE id = ?', [1]);
      if (taskInDb) {
        expect(taskInDb.status).toBe('Pending Payment');
      }
    });
  });

  /**
   * BILL-02: Fee Structure Applied
   */
  describe('BILL-02: Default Fee Structure Applied', () => {
    it('should apply General Waste default fees', async () => {
      const invoice = {
        taskId: 1,
        residentId: 1,
        taskType: 'General Waste'
        // No custom fees - should use defaults
      };

      const response = await request(app)
        .post('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invoice);

      expect(response.status).toBe(201);
      expect(response.body.invoice.total).toBe(60); // 20+15+25
    });

    it('should apply Bulk Waste default fees', async () => {
      const invoice = {
        taskId: 2,
        residentId: 1,
        taskType: 'Bulk Waste'
      };

      const response = await request(app)
        .post('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invoice);

      expect(response.status).toBe(201);
      expect(response.body.invoice.total).toBe(120); // 50+30+40
    });

    it('should apply Hazardous Waste default fees', async () => {
      const invoice = {
        taskId: 3,
        residentId: 1,
        taskType: 'Hazardous Waste'
      };

      const response = await request(app)
        .post('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invoice);

      expect(response.status).toBe(201);
      expect(response.body.invoice.total).toBe(210); // 100+50+60
    });
  });

  /**
   * BILL-03: List All Invoices (Admin)
   */
  describe('BILL-03: List All Invoices', () => {
    it('should retrieve all invoices for admin', async () => {
      const response = await request(app)
        .get('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  /**
   * BILL-04: Get Invoices by Resident
   */
  describe('BILL-04: Get Invoices by Resident', () => {
    it('should retrieve resident-specific invoices', async () => {
      const response = await request(app)
        .get('/api/billing/resident/1')
        .set('Authorization', `Bearer ${process.env.USER_TOKEN || 'test-user-token'}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  /**
   * BILL-05: Mark Invoice as Paid
   */
  describe('BILL-05: Mark Invoice as Paid', () => {
    let invoiceId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          taskId: 1,
          residentId: 1,
          taskType: 'General Waste'
        });
      invoiceId = createResponse.body.invoiceId;
    });

    it('should mark invoice as paid and update task status', async () => {
      const response = await request(app)
        .put(`/api/billing/${invoiceId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.invoice.status).toBe('Paid');
      expect(response.body.invoice).toHaveProperty('paidAt');

      // Verify task status
      const taskInDb = await db.get('SELECT * FROM Tasks WHERE id = ?', [1]);
      if (taskInDb) {
        expect(taskInDb.status).toBe('Payment Completed');
      }
    });
  });

  /**
   * BILL-06: Delete Unpaid Invoice
   */
  describe('BILL-06: Delete Unpaid Invoice', () => {
    let invoiceId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          taskId: 1,
          residentId: 1,
          taskType: 'General Waste'
        });
      invoiceId = createResponse.body.invoiceId;
    });

    it('should delete invoice and revert task status', async () => {
      const response = await request(app)
        .delete(`/api/billing/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/deleted/i);

      // Verify task status reverted
      const taskInDb = await db.get('SELECT * FROM Tasks WHERE id = ?', [1]);
      if (taskInDb) {
        expect(taskInDb.status).toBe('Pending Invoice');
      }
    });
  });

  /**
   * BILL-07: Available Tasks for Invoicing
   */
  describe('BILL-07: Available Tasks for Invoicing', () => {
    it('should retrieve tasks ready for invoicing', async () => {
      const response = await request(app)
        .get('/api/billing/available-tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
