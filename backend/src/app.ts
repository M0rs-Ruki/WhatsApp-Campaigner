import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './DB/connect.DB.js';


dotenv.config({ path: './.env' });
const PORT: number = parseInt(process.env.PORT || '3000', 10);
if (isNaN(PORT)) {
    console.error("🔴 PORT environment variable is not a valid number. Exiting.");
    process.exit(1);
}
const app: Express = express();

// --- Middlewares ---
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// --- Routes ---
app.get('/', (req, res) => {
    res.send('WhatsApp Campaigner API - Server is running!');
});

import authRoutes from './Routes/auth.Routes.js';

// API Routes
app.use('/api/auth', authRoutes);

// --- Database Connection and Server Initialization ---
const startServer = async () => {
    try {
        await connectDB();
        console.log("🟢 MongoDB connected successfully!");
        const server = app.listen(PORT, () => {
            console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
        });
        server.on('error', (error: Error) => {
            console.error(`🔴 Server emitted an error:`, error);
        });

    } catch (error) {
        if (error instanceof Error) {
            console.error("🔴 Failed to connect to MongoDB:", error.message);
        } else {
            console.error("🔴 An unknown error occurred during DB connection:", error);
        }
        process.exit(1);
    }
};

startServer();