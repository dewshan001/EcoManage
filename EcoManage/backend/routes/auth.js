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

        // 1. Find the user
        const user = await db.get('SELECT * FROM Users WHERE email = ?', [email]);
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
                fullName: user.fullName,
                email: user.email,
                role: user.role
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

module.exports = router;
