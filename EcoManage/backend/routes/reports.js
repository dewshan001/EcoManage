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
        const {
            status,
            linkedTaskId,
            priority,
            scheduleDate,
            workers,
            vehicleType,
            location,
            description,
            imageUrl,
            userId
        } = req.body;

        const db = getDB();

        // Check if report exists
        const existingReport = await db.get('SELECT * FROM Reports WHERE id = ?', [id]);
        if (!existingReport) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Optional ownership check for resident edits.
        // Admin updates can omit userId and proceed.
        if (userId !== undefined && Number(existingReport.userId) !== Number(userId)) {
            return res.status(403).json({ message: 'You are not allowed to edit this report' });
        }

        if (location !== undefined && !String(location).trim()) {
            return res.status(400).json({ message: 'Location is required' });
        }

        if (description !== undefined && !String(description).trim()) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const nextLocation = location !== undefined ? String(location).trim() : existingReport.location;
        const nextDescription = description !== undefined ? String(description).trim() : existingReport.description;
        const nextImageUrl = imageUrl !== undefined ? imageUrl : existingReport.imageUrl;
        const nextStatus = status !== undefined ? status : existingReport.status;
        const nextLinkedTaskId = linkedTaskId !== undefined ? linkedTaskId : existingReport.linkedTaskId;
        const nextPriority = priority !== undefined ? priority : existingReport.priority;
        const nextScheduleDate = scheduleDate !== undefined ? scheduleDate : existingReport.scheduleDate;
        const nextWorkers = workers !== undefined ? workers : existingReport.workers;
        const nextVehicleType = vehicleType !== undefined ? vehicleType : existingReport.vehicleType;

        const adminFieldsChanged =
            status !== undefined ||
            linkedTaskId !== undefined ||
            priority !== undefined ||
            scheduleDate !== undefined ||
            workers !== undefined ||
            vehicleType !== undefined;

        const decisionDate = adminFieldsChanged ? new Date().toISOString() : existingReport.decisionDate;

        await db.run(
            `UPDATE Reports 
             SET location = ?, description = ?, imageUrl = ?, status = ?, linkedTaskId = ?, priority = ?, scheduleDate = ?, workers = ?, vehicleType = ?, decisionDate = ?
             WHERE id = ?`,
            [
                nextLocation,
                nextDescription,
                nextImageUrl,
                nextStatus,
                nextLinkedTaskId,
                nextPriority,
                nextScheduleDate,
                nextWorkers,
                nextVehicleType,
                decisionDate,
                id
            ]
        );

        // If a new task is linked, insert/update it in the Tasks table
        if (nextLinkedTaskId && nextLinkedTaskId !== existingReport.linkedTaskId) {
            try {
                // Try to insert a new task
                await db.run(
                    'INSERT OR IGNORE INTO Tasks (taskId, reportId, priority, scheduleDate, workers, vehicleType, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [nextLinkedTaskId, existingReport.reportId, nextPriority, nextScheduleDate, nextWorkers, nextVehicleType, 'Pending Vehicle']
                );
            } catch (err) {
                console.error('Error syncing task from report update:', err);
            }
        }

        const updatedReport = await db.get('SELECT * FROM Reports WHERE id = ?', [id]);

        res.json({ message: 'Report updated successfully', id, report: updatedReport });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Server error while updating report' });
    }
});

// DELETE a report
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const result = await db.run('DELETE FROM Reports WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Server error while deleting report' });
    }
});

module.exports = router;
