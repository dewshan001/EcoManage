const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Global database variable
let db;

// Function to initialize the database
async function initDB() {
    try {
        db = await open({
            filename: path.join(__dirname, '../ecomanage.db'),
            driver: sqlite3.Database
        });

        console.log('Connected to the SQLite database.');

        // Initialize tables
        await createTables();

        return db;
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
}

// Function to create necessary tables
async function createTables() {
    try {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fullName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                passwordHash TEXT NOT NULL,
                role TEXT DEFAULT 'Resident',
                contactNumber TEXT,
                address TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Users table initialized.');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS Reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reportId TEXT UNIQUE NOT NULL,
                userId INTEGER,
                location TEXT NOT NULL,
                description TEXT NOT NULL,
                imageUrl TEXT,
                status TEXT DEFAULT 'Pending',
                date DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Safely add userId column to existing Reports table if it doesn't exist
        try {
            await db.exec(`ALTER TABLE Reports ADD COLUMN userId INTEGER;`);
        } catch (e) {
            // Column already exists – this is expected on subsequent starts
        }
        console.log('Reports table initialized.');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

// Function to get the database instance
function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call initDB first.');
    }
    return db;
}

module.exports = {
    initDB,
    getDB
};
