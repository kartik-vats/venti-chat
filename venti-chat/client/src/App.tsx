import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ThemeProvider } from './components/theme/ThemeProvider';
import ChatPage from './pages/ChatPage';
import CallPage from './pages/CallPage';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    const s = io(serverUrl, { withCredentials: true });
    setSocket(s);
    return () => { s.close(); };
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/room/demo" replace />} />
          <Route path="/room/:id" element={<ChatPage socket={socket} />} />
          <Route path="/call/:id" element={<CallPage socket={socket} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
