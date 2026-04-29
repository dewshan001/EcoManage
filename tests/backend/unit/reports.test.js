/**
 * Backend Unit Tests - Reports
 * File: tests/backend/unit/reports.test.js
 * 
 * Tests for report creation, status updates, filtering, and authorization
 * 
 * Run tests: npm test -- reports.test.js
 */

const request = require('supertest');
const app = require('../../../backend/server');
const { getDB } = require('../../../backend/db/database');

describe('Reports Management Tests', () => {
  let db;
  let residentId = 1; // Mock resident ID
  let adminToken = process.env.ADMIN_TOKEN || 'test-admin-token';
  let userToken = process.env.USER_TOKEN || 'test-user-token';

  beforeAll(async () => {
    db = getDB();
    await db.run('DELETE FROM Reports WHERE location LIKE ?', ['%test%']);
  });

  afterEach(async () => {
    await db.run('DELETE FROM Reports WHERE location LIKE ?', ['%test%']);
  });

  /**
   * REP-01: Create Report - Resident Submission
   */
  describe('REP-01: Create Report - Resident Submission', () => {
    it('should create a new report with valid data', async () => {
      const newReport = {
        location: 'Block A Test, Street 5',
        description: 'Overflowing trash bin test',
        imageUrl: 'https://example.com/test-image.jpg'
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newReport);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('reportId');
      expect(response.body).toHaveProperty('id');
      expect(response.body.reportId).toMatch(/^REP-/);

      // Verify in database
      const reportInDb = await db.get(
        'SELECT * FROM Reports WHERE reportId = ?',
        [response.body.reportId]
      );
      expect(reportInDb).toBeDefined();
      expect(reportInDb.status).toBe('Pending');
    });
  });

  /**
   * REP-02: Create Report - Missing Description
   */
  describe('REP-02: Create Report - Missing Description', () => {
    it('should reject report without description', async () => {
      const invalidReport = {
        location: 'Block A Test',
        imageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidReport);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/description|required/i);
    });

    it('should reject report without location', async () => {
      const invalidReport = {
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidReport);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/location|required/i);
    });
  });

  /**
   * REP-03: Get All Reports (Admin View)
   */
  describe('REP-03: Get All Reports (Admin View)', () => {
    beforeEach(async () => {
      // Create test reports
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            location: `Block Test ${i}`,
            description: `Test report ${i}`,
            imageUrl: 'https://example.com/image.jpg'
          });
      }
    });

    it('should retrieve all reports with joined citizen names', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('reportId');
        expect(response.body[0]).toHaveProperty('location');
        expect(response.body[0]).toHaveProperty('status');
      }
    });
  });

  /**
   * REP-04: Get Resident's Reports (Filtered)
   */
  describe('REP-04: Get Resident Reports (Filtered)', () => {
    beforeEach(async () => {
      // Create reports for testing
      await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Block Test Filtered',
          description: 'Filtered test report',
          imageUrl: 'https://example.com/image.jpg'
        });
    });

    it('should retrieve only resident-specific reports', async () => {
      const response = await request(app)
        .get(`/api/reports?userId=${residentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // All returned reports should belong to the filtered user
      response.body.forEach(report => {
        expect(report).toHaveProperty('reportId');
      });
    });
  });

  /**
   * REP-05: Update Report Status - Admin Approve
   */
  describe('REP-05: Update Report Status - Admin Approve', () => {
    let reportId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Block Approval Test',
          description: 'Report for approval',
          imageUrl: 'https://example.com/image.jpg'
        });
      reportId = createResponse.body.reportId;
    });

    it('should update report status to Approved with task linking', async () => {
      const response = await request(app)
        .put(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Approved',
          linkedTaskId: 10,
          priority: 'High',
          scheduleDate: '2026-05-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe('Approved');
      expect(response.body.report).toHaveProperty('decisionDate');
    });
  });

  /**
   * REP-06: Update Report - Resident Edit Own Report
   */
  describe('REP-06: Update Report - Resident Edit Own', () => {
    let reportId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Block Edit Test',
          description: 'Original description',
          imageUrl: 'https://example.com/image.jpg'
        });
      reportId = createResponse.body.reportId;
    });

    it('should allow resident to edit own report location and description', async () => {
      const response = await request(app)
        .put(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Block Edit Test Updated',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.report.location).toBe('Block Edit Test Updated');
      expect(response.body.report.description).toBe('Updated description');
    });
  });

  /**
   * REP-07: Update Report - Resident Cannot Edit Others
   */
  describe('REP-07: Authorization - Cannot Edit Others Report', () => {
    let reportId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Block Auth Test',
          description: 'Authorization test report',
          imageUrl: 'https://example.com/image.jpg'
        });
      reportId = createResponse.body.reportId;
    });

    it('should reject update from different user', async () => {
      const response = await request(app)
        .put(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer different-user-token`)
        .send({
          location: 'Unauthorized update',
          description: 'Should fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/unauthorized|permission/i);
    });
  });

  /**
   * REP-08: Set Decision Date on Status Change
   */
  describe('REP-08: Decision Date on Status Change', () => {
    let reportId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Block Decision Test',
          description: 'Decision date test',
          imageUrl: 'https://example.com/image.jpg'
        });
      reportId = createResponse.body.reportId;
    });

    it('should auto-populate decisionDate when admin updates status', async () => {
      const response = await request(app)
        .put(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Approved'
        });

      expect(response.status).toBe(200);
      expect(response.body.report).toHaveProperty('decisionDate');
      expect(response.body.report.decisionDate).not.toBeNull();
    });
  });

  /**
   * REP-09: Delete Report (Admin)
   */
  describe('REP-09: Delete Report', () => {
    let reportId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Block Delete Test',
          description: 'Report to delete',
          imageUrl: 'https://example.com/image.jpg'
        });
      reportId = createResponse.body.reportId;
    });

    it('should delete report by admin', async () => {
      const response = await request(app)
        .delete(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/deleted/i);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  /**
   * REP-10: Report Status Progression
   */
  describe('REP-10: Status Progression Validation', () => {
    let reportId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Block Progression Test',
          description: 'Status progression test',
          imageUrl: 'https://example.com/image.jpg'
        });
      reportId = createResponse.body.reportId;
    });

    it('should progress status from Pending to Approved', async () => {
      const response = await request(app)
        .put(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Approved' });

      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe('Approved');
    });

    it('should allow rejection from Pending status', async () => {
      const response = await request(app)
        .put(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Rejected' });

      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe('Rejected');
    });
  });
});
