const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main API Route
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to EcoManage API!' });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Initialize Database and Start Server
initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });
