import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  roomId: string; // Typically a user-to-user room id
  senderId: string;
  recipientId: string;
  content: string;
  deliveredAt: Date; // server time
  read: boolean;
}

const MessageSchema: Schema<IMessage> = new Schema<IMessage>({
  roomId: { type: String, required: true, index: true },
  senderId: { type: String, required: true, index: true },
  recipientId: { type: String, required: true, index: true },
  content: { type: String, required: true },
  deliveredAt: { type: Date, required: true, default: () => new Date() },
  read: { type: Boolean, required: true, default: false },
});

MessageSchema.index({ roomId: 1, deliveredAt: -1 });

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);
