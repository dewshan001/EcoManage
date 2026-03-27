const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db/database');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting middleware for user management (create, update, delete)
const userManagementLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // max 10 requests per 5 minutes
    message: 'Too many requests to user management endpoints, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to user management endpoints
app.use('/api/auth/users', userManagementLimiter);

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
