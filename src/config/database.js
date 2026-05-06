import mongoose from 'mongoose';
import { env } from './environment.js';

export const connectDatabase = async () => {
  if (!env.mongoUri) {
    console.warn('MONGO_URI is not set. Skipping MongoDB connection.');
    return null;
  }

  mongoose.set('strictQuery', true);

  try {
    const connection = await mongoose.connect(env.mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return null;
  }
};
