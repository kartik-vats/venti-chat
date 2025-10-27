import mongoose from 'mongoose';
import { config } from './config';

export async function connectToDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  return mongoose.connect(config.mongoUri);
}
