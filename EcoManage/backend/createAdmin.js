const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function createAdmin() {
    const db = await open({
        filename: path.join(__dirname, 'ecomanage.db'),
        driver: sqlite3.Database
    });

    const email = 'admin@ecomanage.com';
    const password = '123456';
    const fullName = 'System Administrator';
    const role = 'Admin';

    // Check if already exists
    const existing = await db.get('SELECT * FROM Users WHERE email = ?', [email]);
    if (existing) {
        console.log('Admin account already exists!');
        await db.close();
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.run(
        `INSERT INTO Users (fullName, email, passwordHash, role) VALUES (?, ?, ?, ?)`,
        [fullName, email, passwordHash, role]
    );

    console.log('✅ Admin account created successfully!');
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role    : ${role}`);
    console.log(`   ID      : ${result.lastID}`);

    await db.close();
}

createAdmin().catch(console.error);
