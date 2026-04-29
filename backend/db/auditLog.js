const { getDB } = require('./database');

/**
 * Log an admin action to the audit trail
 * @param {number} adminId - The ID of the admin performing the action
 * @param {string} action - The action performed (CREATE_USER, UPDATE_USER, DELETE_USER)
 * @param {string} targetType - The type of object being acted upon (USER, RESIDENT, etc.)
 * @param {number} targetId - The ID of the object being acted upon
 * @param {object} changes - An object describing what changed
 * @returns {Promise<void>}
 */
async function logAuditAction(adminId, action, targetType, targetId, changes = {}) {
    try {
        const db = getDB();
        
        // Ensure AUDIT table exists
        await db.exec(`
            CREATE TABLE IF NOT EXISTS AuditLogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                adminId INTEGER NOT NULL,
                action TEXT NOT NULL,
                targetType TEXT NOT NULL,
                targetId INTEGER NOT NULL,
                changes TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (adminId) REFERENCES Users(id)
            );
        `);

        // Create index if needed
        try {
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON AuditLogs(timestamp);`);
        } catch (e) {
            // Index might already exist
        }

        // Insert audit log entry
        await db.run(
            `INSERT INTO AuditLogs (adminId, action, targetType, targetId, changes) VALUES (?, ?, ?, ?, ?)`,
            [adminId, action, targetType, targetId, JSON.stringify(changes)]
        );
    } catch (error) {
        console.error('Error logging audit action:', error);
        // Don't throw - audit logging failure shouldn't break the main operation
    }
}

/**
 * Get audit logs for a specific user
 * @param {number} targetId - The ID of the user to get logs for
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>}
 */
async function getAuditLogsForUser(targetId, limit = 50) {
    try {
        const db = getDB();
        const logs = await db.all(
            `SELECT * FROM AuditLogs WHERE targetId = ? ORDER BY timestamp DESC LIMIT ?`,
            [targetId, limit]
        );
        return logs.map(log => ({
            ...log,
            changes: log.changes ? JSON.parse(log.changes) : {}
        }));
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
}

/**
 * Get all audit logs (admin activity report)
 * @param {number} limit - Maximum number of logs to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>}
 */
async function getAllAuditLogs(limit = 100, offset = 0) {
    try {
        const db = getDB();
        const logs = await db.all(
            `SELECT AL.*, U.fullName as adminName FROM AuditLogs AL 
             LEFT JOIN Users U ON AL.adminId = U.id 
             ORDER BY AL.timestamp DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return logs.map(log => ({
            ...log,
            changes: log.changes ? JSON.parse(log.changes) : {}
        }));
    } catch (error) {
        console.error('Error fetching all audit logs:', error);
        return [];
    }
}

/**
 * Get audit logs for a specific time period
 * @param {string} startDate - ISO date string (e.g., '2024-01-01')
 * @param {string} endDate - ISO date string (e.g., '2024-01-31')
 * @returns {Promise<Array>}
 */
async function getAuditLogsByDateRange(startDate, endDate) {
    try {
        const db = getDB();
        const logs = await db.all(
            `SELECT AL.*, U.fullName as adminName FROM AuditLogs AL 
             LEFT JOIN Users U ON AL.adminId = U.id 
             WHERE DATE(AL.timestamp) >= DATE(?) AND DATE(AL.timestamp) <= DATE(?)
             ORDER BY AL.timestamp DESC`,
            [startDate, endDate]
        );
        return logs.map(log => ({
            ...log,
            changes: log.changes ? JSON.parse(log.changes) : {}
        }));
    } catch (error) {
        console.error('Error fetching audit logs by date range:', error);
        return [];
    }
}

module.exports = {
    logAuditAction,
    getAuditLogsForUser,
    getAllAuditLogs,
    getAuditLogsByDateRange
};
