const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// Fee structure (mirrors frontend)
const feeStructure = {
    'General Waste': { wasteFee: 20, laborFee: 15, vehicleFee: 25 },
    'Bulk Waste': { wasteFee: 50, laborFee: 30, vehicleFee: 40 },
    'Hazardous Waste': { wasteFee: 100, laborFee: 50, vehicleFee: 60 },
    'Recyclables': { wasteFee: 10, laborFee: 10, vehicleFee: 15 }
};

// Helper: generate a unique invoice ID
async function generateInvoiceId(db) {
    const row = await db.get('SELECT invoiceId FROM Invoices ORDER BY id DESC LIMIT 1');
    if (!row) return 'INV-1001';
    const lastNum = parseInt(row.invoiceId.replace('INV-', ''), 10);
    return `INV-${lastNum + 1}`;
}

// Helper: update task status
async function updateTaskStatus(db, taskId, newStatus) {
    if (!taskId) return;
    try {
        await db.run(
            `UPDATE Tasks SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE taskId = ?`,
            [newStatus, taskId]
        );
    } catch (err) {
        console.error(`Error updating task ${taskId} to ${newStatus}:`, err);
    }
}

// ─────────────────────────────────────────────────────────
// GET /api/billing/available-tasks
// Shows tasks ready for invoicing:
//   • Tasks with status = 'Pending Invoice' (new pipeline)
//   • Tasks with status = 'Completed' (stranded legacy tasks)
//   • Tasks linked to Approved/Resolved reports that don't
//     yet have an invoice AND aren't in the billing pipeline
// ─────────────────────────────────────────────────────────
router.get('/available-tasks', async (req, res) => {
    try {
        const db = getDB();
        const tasks = await db.all(`
            SELECT DISTINCT
                t.id,
                t.taskId,
                t.reportId,
                t.vehicleType,
                t.scheduleDate,
                t.status        AS taskStatus,
                r.location,
                r.description,
                r.status        AS reportStatus,
                r.userId        AS residentId,
                u.fullName      AS residentName,
                u.email         AS residentEmail
            FROM Tasks t
            LEFT JOIN Reports r ON t.reportId = r.reportId
            LEFT JOIN Users   u ON r.userId   = u.id
            WHERE (
                -- New pipeline explicitly marked
                t.status IN ('Pending Invoice', 'Completed')
                OR
                -- Legacy / fallback
                (
                    r.status IN ('Approved', 'Resolved')
                    AND r.linkedTaskId IS NOT NULL
                    AND t.status NOT IN ('Pending Invoice', 'Pending Payment', 'Payment Completed')
                )
            )
            AND (
                t.taskId IS NULL
                OR t.taskId NOT IN (
                    SELECT taskId FROM Invoices WHERE taskId IS NOT NULL
                )
            )
            ORDER BY t.updatedAt DESC
        `);
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching available tasks:', error);
        res.status(500).json({ message: 'Server error fetching available tasks.' });
    }
});

// GET /api/billing/migrate-tasks
// One-time endpoint: promotes eligible legacy tasks to 'Pending Invoice'
router.get('/migrate-tasks', async (req, res) => {
    try {
        const db = getDB();
        const result = await db.run(`
            UPDATE Tasks
            SET    status    = 'Pending Invoice',
                   updatedAt = CURRENT_TIMESTAMP
            WHERE  status NOT IN ('Pending Invoice','Pending Payment','Payment Completed')
              AND  (
                   status = 'Completed'
                   OR
                   reportId IN (
                       SELECT reportId FROM Reports
                       WHERE  status IN ('Approved','Resolved')
                         AND  linkedTaskId IS NOT NULL
                   )
              )
        `);
        res.json({ message: `Migration complete. ${result.changes} task(s) promoted to Pending Invoice.` });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ message: 'Migration failed.' });
    }
});

// GET /api/billing — all invoices (admin/manager view)
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const invoices = await db.all('SELECT * FROM Invoices ORDER BY createdAt DESC');
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Server error fetching invoices.' });
    }
});

// GET /api/billing/resident/:userId — invoices for a specific resident
router.get('/resident/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDB();
        const invoices = await db.all(
            'SELECT * FROM Invoices WHERE residentId = ? ORDER BY createdAt DESC',
            [userId]
        );
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching resident invoices:', error);
        res.status(500).json({ message: 'Server error fetching invoices.' });
    }
});

// ─────────────────────────────────────────────────────────
// POST /api/billing — create a new invoice (admin/manager)
// → Task status advances to 'Pending Payment'
// ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { taskId, residentId, residentName, taskType, wasteFee, laborFee, vehicleFee } = req.body;

        if (!residentId || !residentName || !taskType) {
            return res.status(400).json({ message: 'residentId, residentName, and taskType are required.' });
        }

        // Use provided custom fees, fall back to fee structure defaults
        const fees = {
            wasteFee: parseFloat(wasteFee) || (feeStructure[taskType]?.wasteFee ?? 0),
            laborFee: parseFloat(laborFee) || (feeStructure[taskType]?.laborFee ?? 0),
            vehicleFee: parseFloat(vehicleFee) || (feeStructure[taskType]?.vehicleFee ?? 0),
        };
        const total = fees.wasteFee + fees.laborFee + fees.vehicleFee;

        const db = getDB();
        const invoiceId = await generateInvoiceId(db);

        await db.run(
            `INSERT INTO Invoices (invoiceId, taskId, residentId, residentName, taskType, wasteFee, laborFee, vehicleFee, total, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid')`,
            [invoiceId, taskId || null, residentId, residentName, taskType,
                fees.wasteFee, fees.laborFee, fees.vehicleFee, total]
        );

        // Advance task status → Pending Payment
        if (taskId) {
            await updateTaskStatus(db, taskId, 'Pending Payment');
        }

        const invoice = await db.get('SELECT * FROM Invoices WHERE invoiceId = ?', [invoiceId]);
        res.status(201).json({ message: 'Invoice created successfully.', invoice });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Server error creating invoice.' });
    }
});

// ─────────────────────────────────────────────────────────
// PUT /api/billing/:id/pay — resident marks invoice as Paid
// → Task status advances to 'Payment Completed'
// ─────────────────────────────────────────────────────────
router.put('/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const invoice = await db.get('SELECT * FROM Invoices WHERE id = ? OR invoiceId = ?', [id, id]);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }
        if (invoice.status === 'Paid') {
            return res.status(400).json({ message: 'Invoice is already paid.' });
        }

        await db.run(
            `UPDATE Invoices SET status = 'Paid', paidAt = CURRENT_TIMESTAMP WHERE id = ?`,
            [invoice.id]
        );

        // Advance task status → Payment Completed
        if (invoice.taskId) {
            await updateTaskStatus(db, invoice.taskId, 'Payment Completed');
        }

        const updated = await db.get('SELECT * FROM Invoices WHERE id = ?', [invoice.id]);
        res.json({ message: 'Invoice marked as paid.', invoice: updated });
    } catch (error) {
        console.error('Error paying invoice:', error);
        res.status(500).json({ message: 'Server error updating invoice.' });
    }
});

// DELETE /api/billing/:id — delete an invoice (admin only)
// → Resets task back to 'Pending Invoice' so it can be re-invoiced
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const invoice = await db.get('SELECT * FROM Invoices WHERE id = ? OR invoiceId = ?', [id, id]);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }

        await db.run('DELETE FROM Invoices WHERE id = ?', [invoice.id]);

        // If invoice was unpaid, revert task to 'Pending Invoice' so it re-appears in the picker
        if (invoice.status === 'Unpaid' && invoice.taskId) {
            await updateTaskStatus(db, invoice.taskId, 'Pending Invoice');
        }

        res.json({ message: 'Invoice deleted successfully.' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Server error deleting invoice.' });
    }
});

module.exports = router;
