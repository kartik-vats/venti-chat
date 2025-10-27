import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/venti_chat',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
];
