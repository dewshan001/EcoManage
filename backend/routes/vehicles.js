const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// POST a new vehicle
router.post('/', async (req, res) => {
    try {
        const { vehicleId, type, driver, status, condition, location, fuelLevel, lastMaintenance, nextMaintenance, plateNumber } = req.body;

        if (!vehicleId || !type) {
            return res.status(400).json({ message: 'Vehicle ID and Type are required' });
        }

        const db = getDB();

        const result = await db.run(
            `INSERT INTO Vehicles (
                vehicleId, type, driver, status, condition, location, fuelLevel, lastMaintenance, nextMaintenance, plateNumber
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                vehicleId, 
                type, 
                driver || null, 
                status || 'Available', 
                condition || 'Good', 
                location || 'Depot', 
                fuelLevel !== undefined ? fuelLevel : 100, 
                lastMaintenance || null, 
                nextMaintenance || null, 
                plateNumber || null
            ]
        );

        res.status(201).json({
            message: 'Vehicle created successfully',
            vehicleId: vehicleId,
            id: result.lastID
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: 'Vehicle ID already exists' });
        }
        console.error('Error creating vehicle:', error);
        res.status(500).json({ message: 'Server error while creating vehicle' });
    }
});

// GET all vehicles
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        
        const vehicles = await db.all('SELECT * FROM Vehicles ORDER BY createdAt DESC');

        res.json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ message: 'Server error while fetching vehicles' });
    }
});

// GET a vehicle by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const vehicle = await db.get('SELECT * FROM Vehicles WHERE id = ? OR vehicleId = ?', [id, id]);
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json(vehicle);
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).json({ message: 'Server error while fetching vehicle' });
    }
});

// PUT update a vehicle
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { driver, status, condition, location, fuelLevel, lastMaintenance, nextMaintenance } = req.body;
        
        const db = getDB();

        const existingVehicle = await db.get('SELECT * FROM Vehicles WHERE id = ? OR vehicleId = ?', [id, id]);
        if (!existingVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const actualId = existingVehicle.id;

        await db.run(
            `UPDATE Vehicles 
             SET driver = ?, status = ?, condition = ?, location = ?, fuelLevel = ?, lastMaintenance = ?, nextMaintenance = ?, updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                driver !== undefined ? driver : existingVehicle.driver,
                status !== undefined ? status : existingVehicle.status,
                condition !== undefined ? condition : existingVehicle.condition,
                location !== undefined ? location : existingVehicle.location,
                fuelLevel !== undefined ? fuelLevel : existingVehicle.fuelLevel,
                lastMaintenance !== undefined ? lastMaintenance : existingVehicle.lastMaintenance,
                nextMaintenance !== undefined ? nextMaintenance : existingVehicle.nextMaintenance,
                actualId
            ]
        );

        res.json({ message: 'Vehicle updated successfully', id: actualId });
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ message: 'Server error while updating vehicle' });
    }
});

// DELETE a vehicle
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const result = await db.run('DELETE FROM Vehicles WHERE id = ? OR vehicleId = ?', [id, id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ message: 'Server error while deleting vehicle' });
    }
});

module.exports = router;
