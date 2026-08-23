import { v4 as uuidv4 } from 'uuid';

// In-Memory store for active Watch Party rooms
const activeRooms = new Map();

export const setupWatchPartySockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Watch Party Socket Connected: ${socket.id}`);

    // 1. CREATE OR JOIN WATCH PARTY ROOM
    socket.on('join_room', ({ roomCode, username, videoId }) => {
      let code = roomCode;
      if (!code || code === 'create_new') {
        code = uuidv4().substring(0, 8).toUpperCase();
      }

      socket.join(code);
      socket.roomCode = code;
      socket.username = username || 'Anonymous Viewer';

      if (!activeRooms.has(code)) {
        activeRooms.set(code, {
          roomCode: code,
          videoId: videoId || 1,
          hostSocketId: socket.id,
          currentTime: 0,
          isPlaying: false,
          members: []
        });
      }

      const room = activeRooms.get(code);
      if (!room.members.some(m => m.socketId === socket.id)) {
        room.members.push({ socketId: socket.id, username: socket.username });
      }

      // Notify caller of successful room join & current sync state
      socket.emit('room_joined', {
        roomCode: code,
        isHost: room.hostSocketId === socket.id,
        currentTime: room.currentTime,
        isPlaying: room.isPlaying,
        videoId: room.videoId,
        members: room.members
      });

      // Broadcast updated member list to room
      io.to(code).emit('members_updated', { members: room.members });

      // Send system message in chat
      io.to(code).emit('chat_message', {
        id: Date.now(),
        user: 'SYSTEM',
        text: `${socket.username} joined the Watch Party!`,
        isSystem: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    // 2. SYNCHRONIZE PLAY / PAUSE / SEEK EVENTS
    socket.on('sync_playback', ({ roomCode, action, currentTime }) => {
      const room = activeRooms.get(roomCode);
      if (room) {
        room.currentTime = currentTime;
        if (action === 'play') room.isPlaying = true;
        if (action === 'pause') room.isPlaying = false;

        // Broadcast sync event to all other room members
        socket.to(roomCode).emit('playback_synced', {
          action,
          currentTime,
          sender: socket.username
        });
      }
    });

    // 3. REAL-TIME CHAT MESSAGES
    socket.on('send_chat', ({ roomCode, message }) => {
      if (!message || !message.trim()) return;

      const chatItem = {
        id: Date.now(),
        user: socket.username,
        text: message.trim(),
        isSystem: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      io.to(roomCode).emit('chat_message', chatItem);
    });

    // 4. DISCONNECT & LEAVE ROOM
    socket.on('disconnect', () => {
      if (socket.roomCode && activeRooms.has(socket.roomCode)) {
        const room = activeRooms.get(socket.roomCode);
        room.members = room.members.filter(m => m.socketId !== socket.id);

        if (room.members.length === 0) {
          activeRooms.delete(socket.roomCode);
        } else {
          // Reassign host if host left
          if (room.hostSocketId === socket.id) {
            room.hostSocketId = room.members[0].socketId;
            io.to(room.members[0].socketId).emit('host_assigned');
          }
          io.to(socket.roomCode).emit('members_updated', { members: room.members });
          io.to(socket.roomCode).emit('chat_message', {
            id: Date.now(),
            user: 'SYSTEM',
            text: `${socket.username} left the room.`,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }
    });
  });
};
