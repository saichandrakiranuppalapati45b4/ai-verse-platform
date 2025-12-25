import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './src/config/database.js';

// Import routes
import authRoutes from './src/routes/auth.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import homeRoutes from './src/routes/home.routes.js';
import aboutRoutes from './src/routes/about.routes.js';
import eventsRoutes from './src/routes/events.routes.js';
import liveEventsRoutes from './src/routes/live-events.routes.js';
import galleryRoutes from './src/routes/gallery.routes.js';
import teamRoutes from './src/routes/team.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import juryRoutes from './src/routes/jury.routes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: true, // Allow any origin
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/live-events', liveEventsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jury', juryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI Verse API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// Catch-all route for SPA (must be after API routes but before any other error handlers if possible, actually needs to differentiate)
// If it's an API request that wasn't matched, return 404
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API Route not found' });
});

// For any other request, serve index.html (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 AI Verse Backend Server Started`);
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at: http://localhost:${PORT}/api`);
    console.log(`🔒 Default admin credentials: 24pa1a45b4@vishnu.edu.in / Sai_kiran@4845`);
    console.log(`\n✨ Ready to accept requests!\n`);
});

export default app;
