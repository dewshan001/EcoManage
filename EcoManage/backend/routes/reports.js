const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// POST a new report
router.post('/', async (req, res) => {
    try {
        const { userId, location, description, imageUrl } = req.body;

        if (!location || !description) {
            return res.status(400).json({ message: 'Location and description are required' });
        }

        const db = getDB();

        // Generate a simple unique report ID
        const reportId = `REP-${Math.floor(10000 + Math.random() * 90000)}`;
        const date = new Date().toISOString();

        const result = await db.run(
            'INSERT INTO Reports (reportId, userId, location, description, imageUrl, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [reportId, userId || null, location, description, imageUrl || null, 'Pending', date]
        );

        res.status(201).json({
            message: 'Report submitted successfully',
            reportId: reportId,
            id: result.lastID
        });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ message: 'Server error while submitting report' });
    }
});

// GET all reports (with optional userId filter)
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        const db = getDB();

        let reports;
        if (userId) {
            // Filter reports by userId
            reports = await db.all('SELECT * FROM Reports WHERE userId = ? ORDER BY date DESC', [userId]);
        } else {
            // Get all reports (for admins)
            reports = await db.all('SELECT * FROM Reports ORDER BY date DESC');
        }

        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server error while fetching reports' });
    }
});

module.exports = router;
