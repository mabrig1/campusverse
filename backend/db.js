import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set — running with in-memory data only');
    return;
  }

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'campusverse_db' });
  isConnected = true;
  console.log('MongoDB connected to campusverse_db');

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  });
}
