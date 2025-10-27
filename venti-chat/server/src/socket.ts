import { Server, Socket } from 'socket.io';
import { Message } from './models/Message';

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('join-room', (roomId: string, userId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', { userId });
    });

    socket.on('chat-message', async (payload: { roomId: string; senderId: string; recipientId: string; content: string; }) => {
      const fallbackDto = {
        roomId: payload.roomId,
        senderId: payload.senderId,
        recipientId: payload.recipientId,
        content: payload.content,
        deliveredAt: new Date(),
        read: false,
      } as any;
      try {
        const message = await Message.create(fallbackDto);
        io.to(payload.roomId).emit('chat-message', message.toObject());
      } catch {
        io.to(payload.roomId).emit('chat-message', fallbackDto);
      }
    });

    socket.on('typing', (roomId: string, userId: string, isTyping: boolean) => {
      socket.to(roomId).emit('typing', { userId, isTyping });
    });

    // WebRTC signaling events
    socket.on('offer', (roomId: string, offer: RTCSessionDescriptionInit) => {
      socket.to(roomId).emit('offer', offer);
    });
    socket.on('answer', (roomId: string, answer: RTCSessionDescriptionInit) => {
      socket.to(roomId).emit('answer', answer);
    });
    socket.on('ice-candidate', (roomId: string, candidate: RTCIceCandidateInit) => {
      socket.to(roomId).emit('ice-candidate', candidate);
    });

    socket.on('end-call', (roomId: string) => {
      socket.to(roomId).emit('end-call');
    });

    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('user-left');
        }
      }
    });
  });
}
