import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';

const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function CallPage({ socket }: { socket: Socket | null }) {
  const { id: roomId = 'demo' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mode = params.get('mode') === 'voice' ? 'voice' : 'video';
  const [username] = useState<string>(() => localStorage.getItem('username') || 'guest');
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(mode === 'voice');

  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('join-room', roomId, username);
  }, [socket, roomId, username]);

  useEffect(() => {
    if (!socket) return;
    const peer = new RTCPeerConnection({ iceServers });
    setPc(peer);

    const handleIce = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && socket) socket.emit('ice-candidate', roomId!, event.candidate.toJSON());
    };
    peer.onicecandidate = handleIce;
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    };

    async function setupLocal() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      if (mode === 'voice') {
        setCameraOff(true);
      }
    }
    setupLocal();

    async function createOffer() {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket?.emit('offer', roomId!, offer);
    }

    const onOffer = async (offer: RTCSessionDescriptionInit) => {
      if (!peer.currentLocalDescription) {
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket?.emit('answer', roomId!, answer);
      }
    };
    const onAnswer = async (answer: RTCSessionDescriptionInit) => {
      if (!peer.currentRemoteDescription) {
        await peer.setRemoteDescription(answer);
      }
    };
    const onCandidate = async (candidate: RTCIceCandidateInit) => {
      try { await peer.addIceCandidate(candidate); } catch {}
    };
    const onEndCall = () => {
      peer.getSenders().forEach((s) => s.track?.stop());
      peer.close();
      navigate(`/room/${roomId}`);
    };

    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice-candidate', onCandidate);
    socket.on('end-call', onEndCall);

    // Initiator timeout to create the offer
    const offerTimeout = setTimeout(createOffer, 500);

    return () => {
      clearTimeout(offerTimeout);
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice-candidate', onCandidate);
      socket.off('end-call', onEndCall);
      peer.getSenders().forEach((s) => s.track?.stop());
      peer.close();
    };
  }, [socket, roomId, mode, navigate]);

  function toggleMute() {
    if (!pc) return;
    pc.getSenders().forEach((s) => {
      if (s.track?.kind === 'audio') s.track.enabled = !s.track.enabled;
    });
    setMuted((m) => !m);
  }
  function toggleCamera() {
    if (!pc) return;
    pc.getSenders().forEach((s) => {
      if (s.track?.kind === 'video') s.track.enabled = !s.track.enabled;
    });
    setCameraOff((c) => !c);
  }
  function endCall() {
    socket?.emit('end-call', roomId!);
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 px-4 py-3 backdrop-blur dark:bg-slate-900/80">
        <h1 className="text-lg font-semibold">Call - {mode}</h1>
      </header>
      <main className="relative flex flex-1 items-center justify-center gap-4 p-4">
        <video ref={remoteVideoRef} className="h-[60vh] max-w-full rounded-xl bg-black" autoPlay playsInline />
        {mode === 'video' && (
          <video ref={localVideoRef} className="absolute bottom-4 right-4 h-40 w-56 rounded-lg border bg-black" autoPlay muted playsInline />
        )}
        {mode === 'voice' && (
          <video ref={localVideoRef} className="hidden" autoPlay muted playsInline />
        )}
        <div className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 transform rounded-full bg-white/80 p-2 shadow backdrop-blur dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="rounded-full border px-4 py-2 text-sm">{muted ? 'Unmute' : 'Mute'}</button>
            {mode === 'video' && (
              <button onClick={toggleCamera} className="rounded-full border px-4 py-2 text-sm">{cameraOff ? 'Camera On' : 'Camera Off'}</button>
            )}
            <button onClick={endCall} className="rounded-full bg-red-600 px-4 py-2 text-sm text-white">End</button>
          </div>
        </div>
      </main>
    </div>
  );
}
