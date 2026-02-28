const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// POST a new task
router.post('/', async (req, res) => {
    try {
        const { taskId, reportId, priority, scheduleDate, workers, vehicleType, status } = req.body;

        if (!taskId || !reportId) {
            return res.status(400).json({ message: 'Task ID and Report ID are required' });
        }

        const db = getDB();

        const result = await db.run(
            'INSERT INTO Tasks (taskId, reportId, priority, scheduleDate, workers, vehicleType, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [taskId, reportId, priority || 'Medium', scheduleDate || null, workers || null, vehicleType || null, status || 'Pending']
        );

        res.status(201).json({
            message: 'Task created successfully',
            taskId: taskId,
            id: result.lastID
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: 'Task ID already exists' });
        }
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error while creating task' });
    }
});

// GET all tasks
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        
        const tasks = await db.all(`
            SELECT Tasks.*, Reports.location as location, Reports.description as description 
            FROM Tasks 
            LEFT JOIN Reports ON Tasks.reportId = Reports.reportId
            ORDER BY Tasks.createdAt DESC
        `);

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error while fetching tasks' });
    }
});

// GET a task by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const task = await db.get('SELECT * FROM Tasks WHERE id = ? OR taskId = ?', [id, id]);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ message: 'Server error while fetching task' });
    }
});

// PUT update a task
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, scheduleDate, workers, vehicleType, assignedTo } = req.body;
        
        const db = getDB();

        const existingTask = await db.get('SELECT * FROM Tasks WHERE id = ? OR taskId = ?', [id, id]);
        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const actualId = existingTask.id;

        await db.run(
            `UPDATE Tasks 
             SET status = ?, priority = ?, scheduleDate = ?, workers = ?, vehicleType = ?, assignedTo = ?, updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                status || existingTask.status,
                priority || existingTask.priority,
                scheduleDate !== undefined ? scheduleDate : existingTask.scheduleDate,
                workers !== undefined ? workers : existingTask.workers,
                vehicleType !== undefined ? vehicleType : existingTask.vehicleType,
                assignedTo !== undefined ? assignedTo : existingTask.assignedTo,
                actualId
            ]
        );

        res.json({ message: 'Task updated successfully', id: actualId });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error while updating task' });
    }
});

// DELETE a task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const result = await db.run('DELETE FROM Tasks WHERE id = ? OR taskId = ?', [id, id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error while deleting task' });
    }
});

module.exports = router;
