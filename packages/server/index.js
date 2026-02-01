const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for Phase 1
    methods: ["GET", "POST"]
  }
});

// The World State
const players = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Spawn new player
  players[socket.id] = {
    id: socket.id,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    // High-def placeholder avatar ID
    avatarId: 'default_humanoid'
  };

  // Send current world state to new player
  socket.emit('init', players);

  // Notify everyone else
  socket.broadcast.emit('player_joined', players[socket.id]);

  // Handle movement
  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;
      socket.broadcast.emit('player_moved', { id: socket.id, ...data });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('player_left', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🌍 Open World Server running on port ${PORT}`);
});
