/**
 * Backend Unit Tests - Vehicles
 * File: tests/backend/unit/vehicles.test.js
 * 
 * Tests for vehicle registration, updates, fleet management
 * 
 * Run tests: npm test -- vehicles.test.js
 */

const request = require('supertest');
const app = require('../../../backend/server');
const { getDB } = require('../../../backend/db/database');

describe('Vehicles Management Tests', () => {
  let db;
  let adminToken = process.env.ADMIN_TOKEN || 'test-admin-token';

  beforeAll(async () => {
    db = getDB();
    await db.run('DELETE FROM Vehicles WHERE vehicleId LIKE ?', ['VH-TEST%']);
  });

  afterEach(async () => {
    await db.run('DELETE FROM Vehicles WHERE vehicleId LIKE ?', ['VH-TEST%']);
  });

  /**
   * VEH-01: Register Vehicle
   */
  describe('VEH-01: Register Vehicle', () => {
    it('should register a new vehicle with valid data', async () => {
      const newVehicle = {
        vehicleId: 'VH-TEST-001',
        type: 'Compactor Truck',
        driver: 'John Driver',
        plateNumber: 'XYZ-1234'
      };

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newVehicle);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('vehicleId');
      expect(response.body.vehicleId).toBe('VH-TEST-001');

      // Verify in database
      const vehicleInDb = await db.get(
        'SELECT * FROM Vehicles WHERE vehicleId = ?',
        [newVehicle.vehicleId]
      );
      expect(vehicleInDb).toBeDefined();
      expect(vehicleInDb.status).toBe('Available');
      expect(vehicleInDb.condition).toBe('Good');
      expect(vehicleInDb.fuelLevel).toBe(100);
    });
  });

  /**
   * VEH-02: Register Vehicle - Duplicate ID
   */
  describe('VEH-02: Register Vehicle - Duplicate ID', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId: 'VH-TEST-DUP',
          type: 'Compactor Truck',
          driver: 'John',
          plateNumber: 'XYZ-1234'
        });
    });

    it('should reject duplicate vehicle ID', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId: 'VH-TEST-DUP',
          type: 'Mini Loader',
          driver: 'Jane',
          plateNumber: 'ABC-5678'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/already|duplicate|exists/i);
    });
  });

  /**
   * VEH-03: List All Vehicles
   */
  describe('VEH-03: List All Vehicles', () => {
    beforeEach(async () => {
      // Create test vehicles
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/vehicles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            vehicleId: `VH-TEST-LIST-${i}`,
            type: 'Compactor Truck',
            driver: `Driver ${i}`,
            plateNumber: `TEST-${i}`
          });
      }
    });

    it('should retrieve all vehicles', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('vehicleId');
        expect(response.body[0]).toHaveProperty('status');
        expect(response.body[0]).toHaveProperty('fuelLevel');
      }
    });
  });

  /**
   * VEH-04: Get Single Vehicle
   */
  describe('VEH-04: Get Single Vehicle', () => {
    let vehicleId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId: 'VH-TEST-SINGLE',
          type: 'Mini Loader',
          driver: 'Test Driver',
          plateNumber: 'TEST-001'
        });
      vehicleId = 'VH-TEST-SINGLE';
    });

    it('should retrieve single vehicle by ID', async () => {
      const response = await request(app)
        .get(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('vehicleId');
      expect(response.body.vehicleId).toBe(vehicleId);
    });
  });

  /**
   * VEH-05: Update Vehicle - Status Change
   */
  describe('VEH-05: Update Vehicle - Status Change', () => {
    let vehicleId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId: 'VH-TEST-STATUS',
          type: 'Compactor Truck',
          driver: 'Status Driver',
          plateNumber: 'STATUS-001'
        });
      vehicleId = 'VH-TEST-STATUS';
    });

    it('should update vehicle status to In Use', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'In Use',
          location: 'Block A'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/updated|success/i);

      // Verify in database
      const vehicleInDb = await db.get(
        'SELECT * FROM Vehicles WHERE vehicleId = ?',
        [vehicleId]
      );
      expect(vehicleInDb.status).toBe('In Use');
    });

    it('should update vehicle status to Maintenance', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Maintenance'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/updated|success/i);
    });
  });

  /**
   * VEH-06: Update Vehicle - Fuel Level
   */
  describe('VEH-06: Update Vehicle - Fuel Level', () => {
    let vehicleId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId: 'VH-TEST-FUEL',
          type: 'Roll-Off Truck',
          driver: 'Fuel Driver',
          plateNumber: 'FUEL-001'
        });
      vehicleId = 'VH-TEST-FUEL';
    });

    it('should update fuel level', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fuelLevel: 45
        });

      expect(response.status).toBe(200);

      // Verify in database
      const vehicleInDb = await db.get(
        'SELECT * FROM Vehicles WHERE vehicleId = ?',
        [vehicleId]
      );
      expect(vehicleInDb.fuelLevel).toBe(45);
    });

    it('should handle fuel level at zero', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fuelLevel: 0
        });

      expect(response.status).toBe(200);

      const vehicleInDb = await db.get(
        'SELECT * FROM Vehicles WHERE vehicleId = ?',
        [vehicleId]
      );
      expect(vehicleInDb.fuelLevel).toBe(0);
    });
  });

  /**
   * VEH-07: Update Vehicle - Maintenance Fields
   */
  describe('VEH-07: Update Vehicle - Maintenance Fields', () => {
    let vehicleId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId: 'VH-TEST-MAINT',
          type: 'Flatbed Truck',
          driver: 'Maintenance Driver',
          plateNumber: 'MAINT-001'
        });
      vehicleId = 'VH-TEST-MAINT';
    });

    it('should update maintenance dates and condition', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lastMaintenance: '2026-04-20',
          nextMaintenance: '2026-06-20',
          condition: 'Fair'
        });

      expect(response.status).toBe(200);

      // Verify in database
      const vehicleInDb = await db.get(
        'SELECT * FROM Vehicles WHERE vehicleId = ?',
        [vehicleId]
      );
      expect(vehicleInDb.condition).toBe('Fair');
      expect(vehicleInDb.lastMaintenance).toBe('2026-04-20');
      expect(vehicleInDb.nextMaintenance).toBe('2026-06-20');
    });

    it('should handle poor condition status', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          condition: 'Poor'
        });

      expect(response.status).toBe(200);

      const vehicleInDb = await db.get(
        'SELECT * FROM Vehicles WHERE vehicleId = ?',
        [vehicleId]
      );
      expect(vehicleInDb.condition).toBe('Poor');
    });
  });

  /**
   * VEH-08: Delete Vehicle
   */
  describe('VEH-08: Delete Vehicle', () => {
    let vehicleId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId: 'VH-TEST-DELETE',
          type: 'Water Tanker',
          driver: 'Delete Driver',
          plateNumber: 'DELETE-001'
        });
      vehicleId = 'VH-TEST-DELETE';
    });

    it('should delete vehicle', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/deleted/i);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
