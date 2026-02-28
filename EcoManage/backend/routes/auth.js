const express = require('express');
const bcrypt = require('bcrypt');
const { getDB } = require('../db/database');

const router = express.Router();

// User Registration Route
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // 1. Basic Validation
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const db = getDB();

        // 2. Check if user already exists
        const existingUser = await db.get('SELECT * FROM Users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // 3. Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. Insert new user into database
        const result = await db.run(
            `INSERT INTO Users (fullName, email, passwordHash) VALUES (?, ?, ?)`,
            [fullName, email, passwordHash]
        );

        // 5. Send success response
        res.status(201).json({
            message: 'User registered successfully!',
            user: {
                id: result.lastID,
                fullName,
                email,
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
        const { status, skill, role } = req.body;

        const db = getDB();

        const worker = await db.get('SELECT * FROM Workers WHERE id = ?', [id]);
        if (!worker) {
            return res.status(404).json({ message: 'Worker not found.' });
        }

        await db.run(
            `UPDATE Workers SET status = ?, skill = ?, role = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
            [status || worker.status, skill || worker.skill, role || worker.role, id]
        );

        res.status(200).json({ message: 'Worker updated successfully.' });
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

module.exports = router;
