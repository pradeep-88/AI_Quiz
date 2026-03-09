import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initializeSocket } from './services/socket.service';

dotenv.config();

if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL is not set; create a Redis (Key Value) on Render and add REDIS_URL to this service.');
}

if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY is not set; quiz generation will fail. Add it in Render Environment.');
}

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Initialize Socket Service
initializeSocket(io);

app.use(cors());
app.use(express.json());

// Serve static client
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/', (req, res) => {
    res.send('AI Quiz Server is running');
});

// SPA fallback (Express 5 compatible)
app.use((req, res, next) => {

    if (req.path.startsWith('/api') || req.path.startsWith('/socket')) {
        return next();
    }

    const indexPath = path.join(publicDir, 'index.html');

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        next();
    }

});

const PORT = process.env.PORT || 3000;

httpServer.on('error', (err: NodeJS.ErrnoException) => {
    console.error('Server failed to start:', err.message);
    process.exit(1);
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});