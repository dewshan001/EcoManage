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
        const selectQuery = `
            SELECT Reports.*, Users.fullName as citizenName 
            FROM Reports 
            LEFT JOIN Users ON Reports.userId = Users.id
        `;

        if (userId) {
            // Filter reports by userId
            reports = await db.all(`${selectQuery} WHERE Reports.userId = ? ORDER BY Reports.date DESC`, [userId]);
        } else {
            // Get all reports (for admins)
            reports = await db.all(`${selectQuery} ORDER BY Reports.date DESC`);
        }

        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server error while fetching reports' });
    }
});

// PUT update a report's status and task details
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, linkedTaskId, priority, scheduleDate, workers, vehicleType } = req.body;

        const db = getDB();

        // Check if report exists
        const existingReport = await db.get('SELECT * FROM Reports WHERE id = ?', [id]);
        if (!existingReport) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const decisionDate = new Date().toISOString();

        await db.run(
            `UPDATE Reports 
             SET status = ?, linkedTaskId = ?, priority = ?, scheduleDate = ?, workers = ?, vehicleType = ?, decisionDate = ?
             WHERE id = ?`,
            [
                status || existingReport.status,
                linkedTaskId || existingReport.linkedTaskId,
                priority || existingReport.priority,
                scheduleDate !== undefined ? scheduleDate : existingReport.scheduleDate,
                workers !== undefined ? workers : existingReport.workers,
                vehicleType !== undefined ? vehicleType : existingReport.vehicleType,
                decisionDate,
                id
            ]
        );

        // If a new task is linked, insert/update it in the Tasks table
        if (linkedTaskId && linkedTaskId !== existingReport.linkedTaskId) {
            try {
                // Try to insert a new task
                await db.run(
                    'INSERT OR IGNORE INTO Tasks (taskId, reportId, priority, scheduleDate, workers, vehicleType, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [linkedTaskId, existingReport.reportId, priority || existingReport.priority, scheduleDate !== undefined ? scheduleDate : existingReport.scheduleDate, workers !== undefined ? workers : existingReport.workers, vehicleType !== undefined ? vehicleType : existingReport.vehicleType, 'Assigned']
                );
            } catch (err) {
                console.error('Error syncing task from report update:', err);
            }
        }

        res.json({ message: 'Report updated successfully', id });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Server error while updating report' });
    }
});

module.exports = router;
