require('dotenv').config();
const path = require('path');
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

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
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

// Serve frontend static build
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback to client index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
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
    console.log(`🚀 Rock Paper Scissors Server running on port ${PORT}`);
    console.log(`📡 Socket.IO initialized and listening for connections`);
    console.log(`💾 Storage Engine: ${isMongoAvailable() ? 'MongoDB' : 'In-Memory Fallback Store'}`);
    console.log(`🌐 Serving full-stack app at http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
}

startServer();
