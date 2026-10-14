const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rps_db';
  try {
    // Short timeout so if local mongo is down, the server instantly falls back without waiting 30s
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to ${uri}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[Database] MongoDB connection failed (${error.message}).`);
    console.log(`[Database] >>> Activating In-Memory Storage Engine with auto-stats & seed data. <<<`);
  }
};

const isMongoAvailable = () => isConnected;

module.exports = {
  connectDB,
  isMongoAvailable,
};
