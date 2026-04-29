const express = require('express');
const bcrypt = require('bcrypt');
const { getDB } = require('../db/database');
const { logAuditAction } = require('../db/auditLog');

const router = express.Router();

async function requireAdmin(db, requestedBy) {
    if (!requestedBy) {
        return { ok: false, status: 400, message: 'requestedBy (admin user id) is required.' };
    }

    const adminUser = await db.get('SELECT id, role FROM Users WHERE id = ?', [requestedBy]);
    if (!adminUser || adminUser.role !== 'Admin') {
        return { ok: false, status: 403, message: 'Admin access required.' };
    }

    return { ok: true };
}

// User Registration Route
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const normalizedFullName = (fullName || '').trim();
        const normalizedEmail = (email || '').trim().toLowerCase();
        const passwordRule = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
        const fullNameRule = /^[\p{L} ]+$/u;

        // 1. Basic Validation
        if (!normalizedFullName || !normalizedEmail || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (!normalizedEmail.endsWith('@gmail.com')) {
            return res.status(400).json({ message: 'Email must be a @gmail.com address.' });
        }

        if (!fullNameRule.test(normalizedFullName)) {
            return res.status(400).json({ message: 'Full name can contain only letters and spaces.' });
        }

        if (!passwordRule.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters and include 1 uppercase letter and 1 symbol.' });
        }

        const db = getDB();

        // 2. Check if user already exists
        const existingUser = await db.get('SELECT * FROM Users WHERE email = ?', [normalizedEmail]);
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // 3. Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. Insert new user into database
        const result = await db.run(
            `INSERT INTO Users (fullName, email, passwordHash) VALUES (?, ?, ?)`,
            [normalizedFullName, normalizedEmail, passwordHash]
        );

        // 5. Send success response
        res.status(201).json({
            message: 'User registered successfully!',
            user: {
                id: result.lastID,
                fullName: normalizedFullName,
                email: normalizedEmail,
                role: 'Resident'
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// User Login Route (basic structure for now, can be expanded with JWT later)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const db = getDB();

        // 1. Find the user in Users table
        let user = await db.get('SELECT * FROM Users WHERE email = ?', [email]);
        let isWorker = false;

        // 1b. If not found in Users, check Workers table
        if (!user) {
            user = await db.get('SELECT * FROM Workers WHERE email = ?', [email]);
            isWorker = !!user;
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 2. Compare passwords
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 3. Send success response
        res.status(200).json({
            message: 'Login successful!',
            user: {
                id: user.id,
                fullName: user.fullName || user.name, // users use fullName, some frontend parts might expect fullName or name
                email: user.email,
                role: isWorker ? 'Worker' : user.role, // Set role to Worker if found in Workers table
                workerRole: isWorker ? user.role : undefined, // Keep specific worker role (e.g. Collector) available
                skill: isWorker ? user.skill : undefined
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});

// User Settings Update Route
router.put('/settings', async (req, res) => {
    try {
        const { userId, fullName, password } = req.body;

        if (!userId || !fullName) {
            return res.status(400).json({ message: 'User ID and Full Name are required.' });
        }

        const db = getDB();

        // Check if user exists
        const user = await db.get('SELECT * FROM Users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        let query = 'UPDATE Users SET fullName = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
        let params = [fullName, userId];

        // If a new password is provided, hash it and include it in the update
        if (password) {
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            query = 'UPDATE Users SET fullName = ?, passwordHash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
            params = [fullName, passwordHash, userId];
        }

        await db.run(query, params);

        res.status(200).json({
            message: 'Profile updated successfully!',
            user: {
                id: user.id,
                fullName: fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ message: 'Internal server error during update.' });
    }
});

// Admin-only: Register a Garbage Manager
router.post('/register-manager', async (req, res) => {
    try {
        const { fullName, email, password, contactNumber, address, registeredBy } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Full name, email, and password are required.' });
        }

        const db = getDB();

        // Verify the registering user is an Admin
        const adminUser = await db.get('SELECT * FROM Users WHERE id = ?', [registeredBy]);
        if (!adminUser || adminUser.role !== 'Admin') {
            return res.status(403).json({ message: 'Only Admins can register Garbage Managers.' });
        }

        // Check if email already exists
        const existingUser = await db.get('SELECT * FROM Users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ message: 'A user with this email already exists.' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert as GarbageManager
        const result = await db.run(
            `INSERT INTO Users (fullName, email, passwordHash, role, contactNumber, address) VALUES (?, ?, ?, 'GarbageManager', ?, ?)`,
            [fullName, email, passwordHash, contactNumber || null, address || null]
        );

        res.status(201).json({
            message: 'Garbage Manager registered successfully!',
            user: {
                id: result.lastID,
                fullName,
                email,
                role: 'GarbageManager',
                contactNumber,
                address
            }
        });

    } catch (error) {
        console.error('Manager registration error:', error);
        res.status(500).json({ message: 'Internal server error during manager registration.' });
    }
});

// Get all Garbage Managers (Admin only)
router.get('/managers', async (req, res) => {
    try {
        const db = getDB();
        const managers = await db.all(
            `SELECT id, fullName, email, role, contactNumber, address, createdAt FROM Users WHERE role = 'GarbageManager' ORDER BY createdAt DESC`
        );
        res.status(200).json({ managers });
    } catch (error) {
        console.error('Fetch managers error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Delete a Garbage Manager (Admin only)
router.delete('/managers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        const user = await db.get('SELECT * FROM Users WHERE id = ? AND role = ?', [id, 'GarbageManager']);
        if (!user) {
            return res.status(404).json({ message: 'Garbage Manager not found.' });
        }
        await db.run('DELETE FROM Users WHERE id = ?', [id]);
        res.status(200).json({ message: 'Manager removed successfully.' });
    } catch (error) {
        console.error('Delete manager error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Update a Garbage Manager (Admin only)
router.put('/managers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, contactNumber, address } = req.body;

        const trimmedFullName = (fullName || '').trim();
        const trimmedEmail = (email || '').trim();
        const trimmedContact = (contactNumber || '').trim();
        const trimmedAddress = (address || '').trim();

        if (!trimmedFullName || !trimmedEmail) {
            return res.status(400).json({ message: 'Full name and email are required.' });
        }

        const db = getDB();
        const manager = await db.get('SELECT * FROM Users WHERE id = ? AND role = ?', [id, 'GarbageManager']);
        if (!manager) {
            return res.status(404).json({ message: 'Garbage Manager not found.' });
        }

        const emailOwner = await db.get('SELECT id FROM Users WHERE email = ? AND id != ?', [trimmedEmail, id]);
        if (emailOwner) {
            return res.status(409).json({ message: 'A user with this email already exists.' });
        }

        await db.run(
            `UPDATE Users
             SET fullName = ?,
                 email = ?,
                 contactNumber = ?,
                 address = ?,
                 updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [trimmedFullName, trimmedEmail, trimmedContact || null, trimmedAddress || null, id]
        );

        const updatedManager = await db.get(
            `SELECT id, fullName, email, role, contactNumber, address, createdAt, updatedAt
             FROM Users
             WHERE id = ? AND role = 'GarbageManager'`,
            [id]
        );

        res.status(200).json({
            message: 'Manager updated successfully.',
            manager: updatedManager
        });
    } catch (error) {
        console.error('Update manager error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Admin/Manager: Register a Worker
router.post('/register-worker', async (req, res) => {
    try {
        const { fullName, email, password, workerRole, skill } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Full name, email, and password are required.' });
        }

        const db = getDB();

        // Check if email already exists in Users
        const existingUser = await db.get('SELECT * FROM Users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ message: 'A user with this email already exists.' });
        }

        // Check if email already exists in Workers
        const existingWorker = await db.get('SELECT * FROM Workers WHERE email = ?', [email]);
        if (existingWorker) {
            return res.status(409).json({ message: 'A worker with this email already exists.' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const initialStatus = 'Available';

        // Insert as Worker into the standalone Workers table
        const result = await db.run(
            `INSERT INTO Workers (fullName, email, passwordHash, role, skill, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [fullName, email, passwordHash, workerRole || null, skill || null, initialStatus]
        );

        res.status(201).json({
            message: 'Worker registered successfully!',
            user: {
                id: `W${result.lastID.toString().padStart(3, '0')}`, // Send formatted ID
                dbId: result.lastID, // Keep original DB ID if needed
                name: fullName,
                email,
                role: workerRole,
                skill,
                status: initialStatus
            }
        });

    } catch (error) {
        console.error('Worker registration error:', error);
        res.status(500).json({ message: 'Internal server error during worker registration.' });
    }
});

// Admin/Manager: Get all Workers
router.get('/workers', async (req, res) => {
    try {
        const db = getDB();
        const workers = await db.all(
            `SELECT id, fullName as name, email, role, skill, status FROM Workers ORDER BY createdAt DESC`
        );
        res.status(200).json({ workers });
    } catch (error) {
        console.error('Fetch workers error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Admin/Manager: Update Worker Status/Skill/Assignment
router.put('/workers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, status, skill, role } = req.body;

        const db = getDB();

        const worker = await db.get('SELECT * FROM Workers WHERE id = ?', [id]);
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found.' });
        }

        const normalizedName = typeof fullName === 'string' ? fullName.trim() : worker.fullName;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : worker.email;

        if (!normalizedName || !normalizedEmail) {
            return res.status(400).json({ message: 'Full name and email are required.' });
        }

        const existingWorkerWithEmail = await db.get(
            'SELECT id FROM Workers WHERE email = ? AND id != ?',
            [normalizedEmail, id]
        );
        if (existingWorkerWithEmail) {
            return res.status(409).json({ message: 'A worker with this email already exists.' });
        }

        await db.run(
            `UPDATE Workers
             SET fullName = ?,
                 email = ?,
                 status = ?,
                 skill = ?,
                 role = ?,
                 updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                normalizedName,
                normalizedEmail,
                status || worker.status,
                skill || worker.skill,
                role || worker.role,
                id
            ]
        );

        const updatedWorker = await db.get(
            'SELECT id, fullName as name, email, role, skill, status FROM Workers WHERE id = ?',
            [id]
        );

        res.status(200).json({
            message: 'Worker updated successfully.',
            worker: updatedWorker
        });
    } catch (error) {
        console.error('Update worker error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Admin/Manager: Delete a Worker
router.delete('/workers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        const worker = await db.get('SELECT * FROM Workers WHERE id = ?', [id]);
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found.' });
        }
        await db.run('DELETE FROM Workers WHERE id = ?', [id]);
        res.status(200).json({ message: 'Worker removed successfully.' });
    } catch (error) {
        console.error('Delete worker error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Get all Residents (for billing form)
router.get('/residents', async (req, res) => {
    try {
        const db = getDB();
        const residents = await db.all(
            `SELECT id, fullName, email FROM Users WHERE role = 'Resident' ORDER BY fullName ASC`
        );
        res.status(200).json({ residents });
    } catch (error) {
        console.error('Fetch residents error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Admin-only: Get all Users (currently supports Resident role management)
router.get('/users', async (req, res) => {
    try {
        const { role, requestedBy, search, limit = 100, offset = 0 } = req.query;
        const db = getDB();

        const adminCheck = await requireAdmin(db, requestedBy);
        if (!adminCheck.ok) {
            return res.status(adminCheck.status).json({ message: adminCheck.message });
        }

        const requestedRole = role || 'Resident';

        // For safety, this endpoint is intentionally limited to Residents for now
        if (requestedRole !== 'Resident') {
            return res.status(400).json({ message: "Only role='Resident' is supported." });
        }

        // Build WHERE clause for search
        let whereClause = 'role = ?';
        let params = [requestedRole];
        
        if (search) {
            whereClause += ' AND (fullName LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Get total count
        const countResult = await db.get(`SELECT COUNT(*) as total FROM Users WHERE ${whereClause}`, params);
        const total = countResult?.total || 0;

        // Get paginated results
        const users = await db.all(
            `SELECT id, fullName, email, role, contactNumber, address, createdAt FROM Users WHERE ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.status(200).json({ 
            users,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                page: Math.floor(parseInt(offset) / parseInt(limit)) + 1
            }
        });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Admin-only: Create a new user (Resident only)
router.post('/users', async (req, res) => {
    try {
        const { requestedBy, fullName, email, password, contactNumber, address } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Full name, email, and password are required.' });
        }

        const db = getDB();
        const adminCheck = await requireAdmin(db, requestedBy);
        if (!adminCheck.ok) {
            return res.status(adminCheck.status).json({ message: adminCheck.message });
        }

        const existingUser = await db.get('SELECT id FROM Users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await db.run(
            `INSERT INTO Users (fullName, email, passwordHash, role, contactNumber, address) VALUES (?, ?, ?, 'Resident', ?, ?)`,
            [fullName, email, passwordHash, contactNumber || null, address || null]
        );

        // Log audit action
        await logAuditAction(
            requestedBy,
            'CREATE_USER',
            'RESIDENT',
            result.lastID,
            { fullName, email, contactNumber, address }
        );

        res.status(201).json({
            message: 'Resident created successfully!',
            user: {
                id: result.lastID,
                fullName,
                email,
                role: 'Resident',
                contactNumber: contactNumber || null,
                address: address || null
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Admin-only: Update a user (Resident only)
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { requestedBy, fullName, email, contactNumber, address } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({ message: 'Full name and email are required.' });
        }

        const db = getDB();
        const adminCheck = await requireAdmin(db, requestedBy);
        if (!adminCheck.ok) {
            return res.status(adminCheck.status).json({ message: adminCheck.message });
        }

        const user = await db.get('SELECT id, role, email FROM Users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.role !== 'Resident') {
            return res.status(403).json({ message: 'Only Resident users can be updated from this endpoint.' });
        }

        // Check if new email is already in use by another user
        if (email !== user.email) {
            const existingUser = await db.get('SELECT id FROM Users WHERE email = ? AND id != ?', [email, id]);
            if (existingUser) {
                return res.status(409).json({ message: 'Email is already in use by another user.' });
            }
        }

        await db.run(
            `UPDATE Users SET fullName = ?, email = ?, contactNumber = ?, address = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
            [fullName, email, contactNumber || null, address || null, id]
        );

        // Log audit action
        await logAuditAction(
            requestedBy,
            'UPDATE_USER',
            'RESIDENT',
            id,
            { fullName, email, contactNumber, address }
        );

        res.status(200).json({
            message: 'User updated successfully!',
            user: {
                id,
                fullName,
                email,
                contactNumber: contactNumber || null,
                address: address || null
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Admin-only: Delete a user (Resident only)
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const requestedBy = req.query.requestedBy || req.body?.requestedBy;

        const db = getDB();
        const adminCheck = await requireAdmin(db, requestedBy);
        if (!adminCheck.ok) {
            return res.status(adminCheck.status).json({ message: adminCheck.message });
        }

        const user = await db.get('SELECT id, role FROM Users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.role !== 'Resident') {
            return res.status(403).json({ message: 'Only Resident users can be deleted from this page.' });
        }

        await db.run('DELETE FROM Users WHERE id = ?', [id]);

        // Log audit action
        await logAuditAction(
            requestedBy,
            'DELETE_USER',
            'RESIDENT',
            id,
            { deletedUser: user }
        );

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
