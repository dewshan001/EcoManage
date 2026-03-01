const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

(async () => {
    try {
        const db = await open({ filename: path.join(__dirname, 'ecomanage.db'), driver: sqlite3.Database });

        const tasks = await db.all("SELECT * FROM Tasks WHERE taskId = 'TASK-7652'");
        console.log('Tasks:', tasks);

        const reports = await db.all("SELECT * FROM Reports WHERE reportId = 'REP-11276'");
        console.log('Report Keys:', reports.length > 0 ? Object.keys(reports[0]) : 'no report');
        console.log('Report Data:', reports);

    } catch (e) {
        console.error(e);
    }
})();
