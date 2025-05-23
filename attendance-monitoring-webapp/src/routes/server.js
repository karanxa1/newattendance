// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const adminRouter = require('./admin');
const attendanceRouter = require('./attendance');
const classesRouter = require('./classes');
const graphRouter = require('./graph');
const authRouter = require('./auth');
const sheetsRouter = require('./sheets');
const excelRouter = require('./excel');

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../../public')));

// Enable CORS (optional, add if frontend and backend are on different origins)
const cors = require('cors');
app.use(cors());

// API routes
app.use('/api', adminRouter);
app.use('/api', attendanceRouter);
app.use('/api', classesRouter);
app.use('/api', graphRouter);
app.use('/api', authRouter);
app.use('/api', sheetsRouter);
app.use('/api', excelRouter);

// Fallback to serve index.html for SPA, but only for non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../../public', 'index.html'));
    } else {
        res.status(404).json({ message: 'API route not found' });
    }
});

const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Listen on all network interfaces for Hugging Face compatibility

app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
    console.log('For local development, access at http://localhost:' + port);
});