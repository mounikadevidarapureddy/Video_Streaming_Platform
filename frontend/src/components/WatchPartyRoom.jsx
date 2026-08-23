import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { X, Send, Users, Copy, Check, MessageSquare, ShieldCheck, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HlsPlayer from './HlsPlayer';

export default function WatchPartyRoom({ video, roomCodeToJoin, onClose }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState(roomCodeToJoin || '');
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    const activeUser = user ? user.username : 'Guest_' + Math.floor(Math.random() * 1000);

    newSocket.emit('join_room', {
      roomCode: roomCodeToJoin || 'create_new',
      username: activeUser,
      videoId: video.id
    });

    newSocket.on('room_joined', (data) => {
      setRoomCode(data.roomCode);
      setIsHost(data.isHost);
      setMembers(data.members || []);
    });

    newSocket.on('members_updated', (data) => {
      setMembers(data.members || []);
    });

    newSocket.on('chat_message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    newSocket.on('host_assigned', () => {
      setIsHost(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomCodeToJoin, video, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;
    socket.emit('send_chat', { roomCode, message: inputMessage });
    setInputMessage('');
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col p-4 md:p-6 animate-fadeIn overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Synchronized Watch Party
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ROOM: {roomCode}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Streaming: <span className="text-white font-semibold">{video.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            {copied ? 'Code Copied!' : 'Copy Room Code'}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Split Layout: Player (Left) + Chat & Members (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden min-h-0">
        
        {/* Synchronized Player (Left 3 columns) */}
        <div className="lg:col-span-3 flex flex-col justify-center bg-slate-950 rounded-3xl p-2 border border-white/10 shadow-2xl relative overflow-hidden">
          <HlsPlayer
            video={video}
            onOpenTip={() => {}}
            onOpenWatchParty={() => {}}
            onUnlockPpv={() => {}}
          />
        </div>

        {/* Real-time Chat & Viewers Sidebar (Right 1 column) */}
        <div className="lg:col-span-1 glass-panel border border-white/10 rounded-3xl flex flex-col overflow-hidden">
          
          {/* Members List Header */}
          <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Active Viewers ({members.length})</span>
            </div>
            {isHost && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                <ShieldCheck className="w-3 h-3" /> Host Controls
              </span>
            )}
          </div>

          {/* Members Avatar Row */}
          <div className="p-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto">
            {members.map((m, idx) => (
              <div
                key={idx}
                title={m.username}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border border-white/20 shrink-0"
              >
                {m.username.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>

          {/* Live Chat Message Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans">
            {chatMessages.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-500 flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-gray-600" />
                No chat messages yet. Send a message to start watching together!
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-xs ${msg.isSystem ? 'text-center my-2' : ''}`}
                >
                  {msg.isSystem ? (
                    <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 text-[10px] font-semibold">
                      {msg.text}
                    </span>
                  ) : (
                    <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-cyan-300">{msg.user}</span>
                        <span className="text-[9px] text-gray-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-gray-200 leading-relaxed">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 bg-slate-950/60 flex items-center gap-2">
            <input
              type="text"
              placeholder="Send message to room..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors shadow-lg shadow-cyan-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
