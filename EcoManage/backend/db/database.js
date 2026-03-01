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
                workerRole TEXT,
                workerSkill TEXT,
                workerStatus TEXT,
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
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                linkedTaskId TEXT,
                priority TEXT,
                scheduleDate TEXT,
                workers INTEGER,
                vehicleType TEXT,
                decisionDate DATETIME
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS Workers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fullName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                passwordHash TEXT NOT NULL,
                role TEXT,
                skill TEXT,
                status TEXT DEFAULT 'Available',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Workers table initialized.');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS Tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                taskId TEXT UNIQUE NOT NULL,
                reportId TEXT,
                priority TEXT,
                scheduleDate TEXT,
                workers INTEGER,
                vehicleType TEXT,
                status TEXT DEFAULT 'Pending',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tasks table initialized.');

        // Safely add assignedTo column to Tasks if it doesn't exist
        try {
            await db.exec(`ALTER TABLE Tasks ADD COLUMN assignedTo TEXT;`);
        } catch (e) { }

        try {
            await db.exec(`ALTER TABLE Tasks ADD COLUMN assignedVehicle TEXT;`);
        } catch (e) { }

        await db.exec(`
            CREATE TABLE IF NOT EXISTS Vehicles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicleId TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL,
                driver TEXT,
                status TEXT DEFAULT 'Available',
                condition TEXT DEFAULT 'Good',
                location TEXT,
                fuelLevel INTEGER DEFAULT 100,
                lastMaintenance TEXT,
                nextMaintenance TEXT,
                plateNumber TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Vehicles table initialized.');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS Invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoiceId TEXT UNIQUE NOT NULL,
                taskId TEXT,
                residentId INTEGER,
                residentName TEXT,
                taskType TEXT,
                wasteFee REAL DEFAULT 0,
                laborFee REAL DEFAULT 0,
                vehicleFee REAL DEFAULT 0,
                total REAL DEFAULT 0,
                status TEXT DEFAULT 'Unpaid',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                paidAt DATETIME
            );
        `);
        console.log('Invoices table initialized.');

        // Safely add userId column to existing Reports table if it doesn't exist
        try {
            await db.exec(`ALTER TABLE Reports ADD COLUMN userId INTEGER;`);
        } catch (e) {
            // Column already exists – this is expected on subsequent starts
        }

        // Safely add task-related columns to existing Reports table if they don't exist
        try {
            await db.exec(`ALTER TABLE Reports ADD COLUMN linkedTaskId TEXT;`);
            await db.exec(`ALTER TABLE Reports ADD COLUMN priority TEXT;`);
            await db.exec(`ALTER TABLE Reports ADD COLUMN scheduleDate TEXT;`);
            await db.exec(`ALTER TABLE Reports ADD COLUMN workers INTEGER;`);
            await db.exec(`ALTER TABLE Reports ADD COLUMN vehicleType TEXT;`);
            await db.exec(`ALTER TABLE Reports ADD COLUMN decisionDate DATETIME;`);
        } catch (e) {
            // Columns already exist
        }
        console.log('Reports table initialized.');

        // Safely add worker columns to existing Users table if they don't exist
        try {
            await db.exec(`ALTER TABLE Users ADD COLUMN workerRole TEXT;`);
            await db.exec(`ALTER TABLE Users ADD COLUMN workerSkill TEXT;`);
            await db.exec(`ALTER TABLE Users ADD COLUMN workerStatus TEXT;`);
        } catch (e) {
            // Columns already exist
        }

        // ── Billing pipeline migration ──────────────────────────────────────
        // Promote any existing tasks that are linked to Approved/Resolved
        // reports but still have a pre-billing status into 'Pending Invoice'
        // so they appear in the invoice picker immediately.
        try {
            await db.run(`
                UPDATE Tasks
                SET    status = 'Pending Invoice',
                       updatedAt = CURRENT_TIMESTAMP
                WHERE  status NOT IN ('Pending Invoice','Pending Payment','Payment Completed')
                  AND  reportId IN (
                       SELECT reportId FROM Reports
                       WHERE  status IN ('Approved','Resolved')
                         AND  linkedTaskId IS NOT NULL
                  )
            `);
            console.log('Billing pipeline migration: eligible tasks promoted to Pending Invoice.');
        } catch (e) {
            console.error('Billing pipeline migration error:', e);
        }
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
