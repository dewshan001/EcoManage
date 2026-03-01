const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Main API Route
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to EcoManage API!' });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Report Routes
const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

// Task Routes
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);

// Vehicle Routes
const vehicleRoutes = require('./routes/vehicles');
app.use('/api/vehicles', vehicleRoutes);

// Billing Routes
const billingRoutes = require('./routes/billing');
app.use('/api/billing', billingRoutes);

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
