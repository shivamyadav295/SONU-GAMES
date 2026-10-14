require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB, isMongoAvailable } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');
const matchController = require('./controllers/matchController');
const setupGameSocket = require('./sockets/gameSocket');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Allow local development from 5173 and any port
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);

// Direct alias for requirements: GET /api/leaderboard
app.get('/api/leaderboard', matchController.getLeaderboard);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isMongoAvailable() ? 'MongoDB' : 'InMemoryFallbackStore',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Initialize Socket Handlers
setupGameSocket(io);

// Start Server
async function startServer() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Rock Paper Scissors Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO initialized and listening for connections`);
    console.log(`💾 Storage Engine: ${isMongoAvailable() ? 'MongoDB' : 'In-Memory Fallback Store'}`);
    console.log(`===============================================`);
  });
}

startServer();
