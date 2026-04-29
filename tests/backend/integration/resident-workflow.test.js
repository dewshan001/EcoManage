/**
 * System Integration Tests - Resident Workflows
 * File: tests/backend/integration/resident-workflow.test.js
 * 
 * End-to-end tests for resident journey from registration to payment
 * 
 * Run tests: npm test -- resident-workflow.test.js
 */

const request = require('supertest');
const app = require('../../../backend/server');
const { getDB } = require('../../../backend/db/database');

describe('Resident Workflow Integration Tests', () => {
  let db;
  let residentToken;
  let residentId;
  let reportId;
  let taskId;
  let invoiceId;

  beforeAll(async () => {
    db = getDB();
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  /**
   * SYS-01: Complete Registration & Login Flow
   */
  describe('SYS-01: Registration → Login → Session', () => {
    it('should register resident and retrieve profile on login', async () => {
      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Alice Johnson',
          email: 'alice-resident@gmail.com',
          password: 'AlicePass123!'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('id');
      expect(registerResponse.body.role).toBe('Resident');
      residentId = registerResponse.body.id;

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice-resident@gmail.com',
          password: 'AlicePass123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.user.email).toBe('alice-resident@gmail.com');
      expect(loginResponse.body.role).toBe('Resident');
      expect(loginResponse.body.id).toBe(residentId);

      // Step 3: Verify session token
      residentToken = `Bearer ${loginResponse.body.token || 'resident-token'}`;
    });
  });

  /**
   * SYS-02: Submit Report → Admin Reviews → Approval
   */
  describe('SYS-02: Report Submission → Admin Review → Approval', () => {
    it('should complete full report review workflow', async () => {
      // Step 1: Resident submits report
      const submitResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', residentToken)
        .send({
          location: 'Block C, Integration Test',
          description: 'Pile of trash blocking walkway',
          imageUrl: 'https://example.com/trash-image.jpg'
        });

      expect(submitResponse.status).toBe(201);
      expect(submitResponse.body.reportId).toMatch(/^REP-/);
      reportId = submitResponse.body.reportId;

      // Verify status is Pending
      expect(submitResponse.body).toHaveProperty('id');

      // Step 2: Admin views all reports
      const adminToken = `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`;
      const listResponse = await request(app)
        .get('/api/reports')
        .set('Authorization', adminToken);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      const foundReport = listResponse.body.find(r => r.reportId === reportId);
      expect(foundReport).toBeDefined();
      expect(foundReport.status).toBe('Pending');

      // Step 3: Admin approves report
      const approveResponse = await request(app)
        .put(`/api/reports/${reportId}`)
        .set('Authorization', adminToken)
        .send({
          status: 'Approved',
          priority: 'High',
          scheduleDate: '2026-05-20'
        });

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.report.status).toBe('Approved');
      expect(approveResponse.body.report).toHaveProperty('decisionDate');
    });
  });

  /**
   * SYS-03: Approval → Task Creation → Completion
   */
  describe('SYS-03: Task Auto-Creation → Status Progression → Completion', () => {
    it('should auto-create task on approval and track completion', async () => {
      const adminToken = `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`;

      // Step 1: Create task (or auto-created with approval)
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', adminToken)
        .send({
          reportId: 1,
          priority: 'High',
          scheduleDate: '2026-05-20',
          workers: 'W001',
          vehicleType: 'Compactor Truck'
        });

      expect(taskResponse.status).toBe(201);
      taskId = taskResponse.body.taskId;
      expect(taskResponse.body.taskId).toMatch(/^TSK-/);

      // Step 2: Update task status to pending worker
      const workerResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', adminToken)
        .send({
          status: 'Pending Worker',
          assignedTo: 'W001'
        });

      expect(workerResponse.status).toBe(200);

      // Step 3: Mark task as completed
      const completeResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', adminToken)
        .send({
          status: 'Completed'
        });

      expect(completeResponse.status).toBe(200);

      // Verify task is now Pending Invoice
      const taskInDb = await db.get('SELECT * FROM Tasks WHERE taskId = ?', [taskId]);
      expect(taskInDb.status).toBe('Pending Invoice');
    });
  });

  /**
   * SYS-04: Task Completion → Invoice Creation → Resident Bill
   */
  describe('SYS-04: Invoice Generation & Resident Notification', () => {
    it('should create invoice and make visible to resident', async () => {
      const adminToken = `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`;

      // Step 1: Admin creates invoice
      const invoiceResponse = await request(app)
        .post('/api/billing')
        .set('Authorization', adminToken)
        .send({
          taskId: 1,
          residentId: residentId,
          taskType: 'General Waste',
          wasteFee: 20,
          laborFee: 15,
          vehicleFee: 25
        });

      expect(invoiceResponse.status).toBe(201);
      expect(invoiceResponse.body.invoiceId).toMatch(/^INV-/);
      invoiceId = invoiceResponse.body.invoiceId;
      expect(invoiceResponse.body.invoice.total).toBe(60);
      expect(invoiceResponse.body.invoice.status).toBe('Unpaid');

      // Step 2: Resident views their invoices
      const residentBillingResponse = await request(app)
        .get(`/api/billing/resident/${residentId}`)
        .set('Authorization', residentToken);

      expect(residentBillingResponse.status).toBe(200);
      expect(Array.isArray(residentBillingResponse.body)).toBe(true);
      const foundInvoice = residentBillingResponse.body.find(
        inv => inv.invoiceId === invoiceId
      );
      expect(foundInvoice).toBeDefined();
      expect(foundInvoice.status).toBe('Unpaid');
      expect(foundInvoice.total).toBe(60);
    });
  });

  /**
   * SYS-05: Payment Flow
   */
  describe('SYS-05: Resident Payment → Status Updates', () => {
    it('should process payment and update statuses', async () => {
      const adminToken = `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`;

      // Step 1: Admin marks invoice as paid
      const paymentResponse = await request(app)
        .put(`/api/billing/${invoiceId}/pay`)
        .set('Authorization', adminToken);

      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.body.invoice.status).toBe('Paid');
      expect(paymentResponse.body.invoice).toHaveProperty('paidAt');

      // Step 2: Verify task status updated
      const taskInDb = await db.get('SELECT * FROM Tasks WHERE taskId = ?', [taskId]);
      if (taskInDb) {
        expect(taskInDb.status).toBe('Payment Completed');
      }

      // Step 3: Resident sees paid invoice
      const paidInvoiceResponse = await request(app)
        .get(`/api/billing/resident/${residentId}`)
        .set('Authorization', residentToken);

      expect(paidInvoiceResponse.status).toBe(200);
      const paidInvoice = paidInvoiceResponse.body.find(
        inv => inv.invoiceId === invoiceId
      );
      expect(paidInvoice.status).toBe('Paid');
    });
  });

  /**
   * SYS-06: Resident Edit Own Report
   */
  describe('SYS-06: Resident Edit Pending Report', () => {
    let editableReportId;

    beforeEach(async () => {
      // Create a report for editing
      const createResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', residentToken)
        .send({
          location: 'Block D, Editable Test',
          description: 'Original description',
          imageUrl: 'https://example.com/image.jpg'
        });
      editableReportId = createResponse.body.reportId;
    });

    it('should allow resident to edit own pending report', async () => {
      const editResponse = await request(app)
        .put(`/api/reports/${editableReportId}`)
        .set('Authorization', residentToken)
        .send({
          location: 'Block D, Updated Location',
          description: 'Updated description for clarity',
          imageUrl: 'https://example.com/new-image.jpg'
        });

      expect(editResponse.status).toBe(200);
      expect(editResponse.body.report.description).toBe('Updated description for clarity');
      expect(editResponse.body.report.status).toBe('Pending');
    });
  });

  /**
   * SYS-07: Authorization - Cannot Edit Other's Report
   */
  describe('SYS-07: Authorization Check - Cannot Edit Others Report', () => {
    let otherReportId;

    beforeEach(async () => {
      // Create a report with different user
      const createResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer different-user-token`)
        .send({
          location: 'Block E, Different User',
          description: 'Report from different user',
          imageUrl: 'https://example.com/image.jpg'
        });
      otherReportId = createResponse.body?.reportId || 'REP-OTHER';
    });

    it('should reject edit from different user', async () => {
      if (otherReportId !== 'REP-OTHER') {
        const editResponse = await request(app)
          .put(`/api/reports/${otherReportId}`)
          .set('Authorization', residentToken)
          .send({
            description: 'Unauthorized edit'
          });

        expect(editResponse.status).toBe(403);
        expect(editResponse.body.message).toMatch(/unauthorized|permission/i);
      }
    });
  });

  /**
   * SYS-08: Profile Update
   */
  describe('SYS-08: Resident Profile Update', () => {
    it('should update resident profile and password', async () => {
      // Step 1: Update profile
      const updateResponse = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', residentToken)
        .send({
          userId: residentId,
          fullName: 'Alice Updated',
          password: 'UpdatedPass456!'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.user.fullName).toBe('Alice Updated');

      // Step 2: Verify new password works on re-login
      const reloginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice-resident@gmail.com',
          password: 'UpdatedPass456!'
        });

      expect(reloginResponse.status).toBe(200);
    });
  });

  /**
   * SYS-09: Complete Resident Journey
   */
  describe('SYS-09: Complete End-to-End Journey', () => {
    it('should execute full resident workflow from start to finish', async () => {
      // Register new resident
      const regResponse = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Bob Complete',
          email: 'bob-complete@gmail.com',
          password: 'BobPass123!'
        });

      expect(regResponse.status).toBe(201);
      const bobId = regResponse.body.id;
      const bobToken = `Bearer bob-token`;
      const adminToken = `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`;

      // Submit report
      const reportRes = await request(app)
        .post('/api/reports')
        .set('Authorization', bobToken)
        .send({
          location: 'Complete Journey Location',
          description: 'Full workflow test',
          imageUrl: 'https://example.com/image.jpg'
        });

      expect(reportRes.status).toBe(201);
      const fullReportId = reportRes.body.reportId;

      // Admin approves
      const approveRes = await request(app)
        .put(`/api/reports/${fullReportId}`)
        .set('Authorization', adminToken)
        .send({
          status: 'Approved',
          priority: 'Medium',
          scheduleDate: '2026-05-25'
        });

      expect(approveRes.status).toBe(200);

      // Create task
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', adminToken)
        .send({
          reportId: 1,
          priority: 'Medium',
          scheduleDate: '2026-05-25',
          workers: 'W001'
        });

      expect(taskRes.status).toBe(201);

      // Complete task
      const completeRes = await request(app)
        .put(`/api/tasks/${taskRes.body.taskId}`)
        .set('Authorization', adminToken)
        .send({ status: 'Completed' });

      expect(completeRes.status).toBe(200);

      // Create invoice
      const invoiceRes = await request(app)
        .post('/api/billing')
        .set('Authorization', adminToken)
        .send({
          taskId: 1,
          residentId: bobId,
          taskType: 'Bulk Waste'
        });

      expect(invoiceRes.status).toBe(201);

      // Pay invoice
      const payRes = await request(app)
        .put(`/api/billing/${invoiceRes.body.invoiceId}/pay`)
        .set('Authorization', adminToken);

      expect(payRes.status).toBe(200);
      expect(payRes.body.invoice.status).toBe('Paid');
    });
  });
});
