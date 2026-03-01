const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// Fee structure for auto-invoice generation
const feeStructure = {
    'General Waste': { wasteFee: 20, laborFee: 15, vehicleFee: 25 },
    'Bulk Waste': { wasteFee: 50, laborFee: 30, vehicleFee: 40 },
    'Hazardous Waste': { wasteFee: 100, laborFee: 50, vehicleFee: 60 },
    'Recyclables': { wasteFee: 10, laborFee: 10, vehicleFee: 15 }
};

async function autoCreateInvoice(db, task, report) {
    try {
        // Determine waste type — use vehicleType as a proxy if description lacks type
        const taskType = report ? (report.description || 'General Waste') : 'General Waste';
        // Try to match to a known fee category
        const knownTypes = Object.keys(feeStructure);
        const matchedType = knownTypes.find(t => taskType.toLowerCase().includes(t.toLowerCase())) || 'General Waste';
        const fees = feeStructure[matchedType];
        const total = fees.wasteFee + fees.laborFee + fees.vehicleFee;

        // Generate invoice ID
        const lastRow = await db.get('SELECT invoiceId FROM Invoices ORDER BY id DESC LIMIT 1');
        const lastNum = lastRow ? parseInt(lastRow.invoiceId.replace('INV-', ''), 10) : 1000;
        const invoiceId = `INV-${lastNum + 1}`;

        // Get resident info from Users table if possible
        let residentName = 'Unknown';
        let residentId = null;
        if (report && report.userId) {
            const resident = await db.get('SELECT id, fullName FROM Users WHERE id = ?', [report.userId]);
            if (resident) {
                residentName = resident.fullName;
                residentId = resident.id;
            }
        }

        await db.run(
            `INSERT OR IGNORE INTO Invoices (invoiceId, taskId, residentId, residentName, taskType, wasteFee, laborFee, vehicleFee, total, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid')`,
            [invoiceId, task.taskId, residentId, residentName, matchedType, fees.wasteFee, fees.laborFee, fees.vehicleFee, total]
        );

        console.log(`Auto-invoice created: ${invoiceId} for task ${task.taskId}`);
    } catch (err) {
        console.error('Error auto-creating invoice:', err);
    }
}

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
        const { status, priority, scheduleDate, workers, vehicleType, assignedTo, assignedVehicle } = req.body;

        const db = getDB();

        const existingTask = await db.get('SELECT * FROM Tasks WHERE id = ? OR taskId = ?', [id, id]);
        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const actualId = existingTask.id;

        await db.run(
            `UPDATE Tasks 
             SET status = ?, priority = ?, scheduleDate = ?, workers = ?, vehicleType = ?, assignedTo = ?, assignedVehicle = ?, updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                status || existingTask.status,
                priority || existingTask.priority,
                scheduleDate !== undefined ? scheduleDate : existingTask.scheduleDate,
                workers !== undefined ? workers : existingTask.workers,
                vehicleType !== undefined ? vehicleType : existingTask.vehicleType,
                assignedTo !== undefined ? assignedTo : existingTask.assignedTo,
                assignedVehicle !== undefined ? assignedVehicle : existingTask.assignedVehicle,
                actualId
            ]
        );

        // If task is set to Completed or Pending Invoice, advance to 'Pending Invoice'
        // and mark the linked report as Resolved
        if ((status === 'Completed' || status === 'Pending Invoice') && existingTask.reportId) {
            // Override the status we just wrote to 'Pending Invoice'
            await db.run(
                `UPDATE Tasks SET status = 'Pending Invoice', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
                [actualId]
            );
            try {
                await db.run(
                    `UPDATE Reports SET status = 'Resolved' WHERE reportId = ?`,
                    [existingTask.reportId]
                );
            } catch (err) {
                console.error('Error updating linked report status:', err);
            }
        }

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
