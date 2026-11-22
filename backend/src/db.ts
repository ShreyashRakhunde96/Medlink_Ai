import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
mongoose.set('bufferCommands', false);

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('username:password')) {
    console.warn('⚠️  MONGODB_URI is not configured in backend/.env yet. Please paste your MongoDB connection string.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    return null;
  }
}
