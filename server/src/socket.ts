import { Server, Socket } from "socket.io";
import { Message } from "./models/Message";

interface RoomUsers {
  [roomId: string]: Set<string>;
}

const rooms: RoomUsers = {};

export function setupSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("New socket connected:", socket.id);

    // 🟢 Join Room
    socket.on("join-room", (roomId: string, userId: string) => {
      if (!rooms[roomId]) {
        rooms[roomId] = new Set();
      }

      rooms[roomId].add(userId);
      socket.join(roomId);

      console.log(`${userId} joined room ${roomId}`);
      socket.to(roomId).emit("user-joined", { userId });
    });

    // 💬 Chat Messages
    socket.on(
      "chat-message",
      async (payload: {
        roomId: string;
        senderId: string;
        recipientId: string;
        content: string;
      }) => {
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
          io.to(payload.roomId).emit("chat-message", message.toObject());
        } catch {
          io.to(payload.roomId).emit("chat-message", fallbackDto);
        }
      }
    );

    // ⌨ Typing Indicator
    socket.on(
      "typing",
      (roomId: string, userId: string, isTyping: boolean) => {
        socket.to(roomId).emit("typing", { userId, isTyping });
      }
    );

    // 📞 WebRTC signaling
    socket.on(
      "offer",
      (roomId: string, userId: string, offer: RTCSessionDescriptionInit) => {
        socket.to(roomId).emit("offer", { userId, offer });
      }
    );

    socket.on(
      "answer",
      (roomId: string, userId: string, answer: RTCSessionDescriptionInit) => {
        socket.to(roomId).emit("answer", { userId, answer });
      }
    );

    socket.on(
      "ice-candidate",
      (roomId: string, userId: string, candidate: RTCIceCandidateInit) => {
        socket.to(roomId).emit("ice-candidate", { userId, candidate });
      }
    );

    // ❌ End Call
    socket.on("end-call", (roomId: string, userId: string) => {
      socket.to(roomId).emit("end-call", { userId });
    });

    // 🔴 Handle Disconnect
    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id && rooms[roomId]) {
          // Remove user from room set
          rooms[roomId].delete(socket.id);

          console.log(`User ${socket.id} left room ${roomId}`);
          socket.to(roomId).emit("user-left", { userId: socket.id });

          // Cleanup empty room
          if (rooms[roomId].size === 0) {
            delete rooms[roomId];
          }
        }
      }
    });
  });
}
