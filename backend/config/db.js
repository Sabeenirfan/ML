const mongoose = require('mongoose');

/** Call this to check if MongoDB is connected (e.g. in auth routes). */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not set in .env. Auth and DB features will not work.');
    return;
  }

  const mongoUri = process.env.MONGO_URI.trim();
  if (!mongoUri) {
    console.error('❌ MONGO_URI is empty. Auth and DB features will not work.');
    return;
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    const uri = mongoUri.replace(/mongodb:\/\/localhost\b/, 'mongodb://127.0.0.1');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('   Server will still start; auth/signup/login will not work until MongoDB is available.');
    console.error('   To fix: 1) Ensure MongoDB is running  2) Check MONGO_URI in .env  3) Or use MongoDB Atlas (cloud).');
  }
};

module.exports = connectDB;
module.exports.isConnected = isConnected;