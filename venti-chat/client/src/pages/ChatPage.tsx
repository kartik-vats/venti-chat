import { useEffect, useMemo, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';

type Message = {
  _id?: string;
  roomId: string;
  senderId: string;
  recipientId: string;
  content: string;
  deliveredAt?: string;
  read?: boolean;
};

export default function ChatPage({ socket }: { socket: Socket | null }) {
  const { id: roomId = 'demo' } = useParams();
  const navigate = useNavigate();
  const [username] = useState<string>(() => {
    const existing = localStorage.getItem('username');
    if (existing) return existing;
    const u = `guest-${Math.random().toString(36).slice(2, 7)}`;
    localStorage.setItem('username', u);
    return u;
  });
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!roomId) return;
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    fetch(`${serverUrl}/api/messages/${roomId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data))
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('join-room', roomId, username);

    const onMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };
    const onTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
    };
    socket.on('chat-message', onMessage);
    socket.on('typing', onTyping);
    return () => {
      socket.off('chat-message', onMessage);
      socket.off('typing', onTyping);
    };
  }, [socket, roomId, username]);

  const hasTyping = useMemo(() => Object.entries(typingUsers).some(([u, t]) => u !== username && t), [typingUsers, username]);

  function sendMessage() {
    if (!socket || !roomId) return;
    const msg: Message = { roomId, senderId: username, recipientId: 'peer', content: input };
    socket.emit('chat-message', msg);
    setInput('');
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 px-4 py-3 backdrop-blur dark:bg-slate-900/80">
        <div>
          <h1 className="text-lg font-semibold">venti-chat</h1>
          <p className="text-xs text-slate-500">Room: {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-3 py-1 text-sm" onClick={() => navigate(`/call/${roomId}?mode=video`)}>Video</button>
          <button className="rounded-md border px-3 py-1 text-sm" onClick={() => navigate(`/call/${roomId}?mode=voice`)}>Voice</button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mx-auto max-w-2xl space-y-2">
          {messages.map((m, i) => (
            <div key={m._id || i} className={`flex ${m.senderId === username ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-2xl px-3 py-2 text-sm ${m.senderId === username ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                <div>{m.content}</div>
                <div className="mt-1 text-[10px] opacity-70">{new Date(m.deliveredAt || Date.now()).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          {hasTyping && (
            <div className="text-xs text-slate-500">Someone is typing...</div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>
      <footer className="border-t p-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring"
            placeholder="Type a message"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              socket?.emit('typing', roomId!, username, e.target.value.length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <button className="rounded-md border px-3 py-2 text-sm" onClick={sendMessage}>Send</button>
        </div>
      </footer>
    </div>
  );
}
