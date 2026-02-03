import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import {
    PlayerState,
    MoveData,
    ChatMessage,
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from './types'

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(server, {
    cors: {
        origin: '*', // Allow all for Phase 1
        methods: ['GET', 'POST'],
    },
})

// The World State
const players: Record<string, PlayerState> = {}

io.on('connection', socket => {
    console.log('User connected:', socket.id)

    // Spawn new player
    players[socket.id] = {
        id: socket.id,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        avatarId: 'default_humanoid',
    }

    // Send current world state to new player
    socket.emit('init', players)

    // Notify everyone else
    socket.broadcast.emit('player_joined', players[socket.id])

    // Handle movement
    socket.on('move', (data: MoveData) => {
        if (players[socket.id]) {
            players[socket.id].position = data.position
            players[socket.id].rotation = data.rotation
            socket.broadcast.emit('player_moved', { id: socket.id, ...data })
        }
    })

    // Handle chat messages
    socket.on('chat', (message: string) => {
        const chatMessage: ChatMessage = {
            senderId: socket.id,
            senderName: socket.data.name,
            message,
            timestamp: Date.now(),
        }
        console.log(`💬 ${socket.id}: ${message}`)
        io.emit('chat', chatMessage)
    })

    // Handle Audio (Voice Chat)
    socket.on('audio', buffer => {
        // Relay audio to all other clients.
        // (Later: filter by distance to save bandwidth)
        socket.broadcast.emit('player_audio', { id: socket.id, buffer })
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
        delete players[socket.id]
        io.emit('player_left', socket.id)
    })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
    console.log(`🌍 Open World Server running on port ${PORT}`)
})
