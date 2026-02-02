import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

interface PlayerState {
    id: string
    position: [number, number, number]
    rotation: [number, number, number]
    avatarId?: string
}

interface GameState {
    socket: Socket | null
    players: Record<string, PlayerState>
    myId: string | null
    connect: () => void
    move: (pos: [number, number, number], rot: [number, number, number]) => void
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'

export const useGameStore = create<GameState>((set, get) => ({
    socket: null,
    players: {},
    myId: null,

    connect: () => {
        if (get().socket) return

        const socket = io(SERVER_URL)

        socket.on('connect', () => {
            console.log('✅ Connected to World Server with ID:', socket.id)
            set({ myId: socket.id })
        })

        socket.on('init', serverPlayers => {
            set({ players: serverPlayers })
        })

        socket.on('player_joined', newPlayer => {
            set(state => ({
                players: { ...state.players, [newPlayer.id]: newPlayer },
            }))
        })

        socket.on('player_moved', data => {
            set(state => {
                if (!state.players[data.id]) return state // Ignore unknown players
                return {
                    players: {
                        ...state.players,
                        [data.id]: {
                            ...state.players[data.id],
                            position: data.position,
                            rotation: data.rotation,
                        },
                    },
                }
            })
        })

        socket.on('player_left', id => {
            set(state => {
                const newPlayers = { ...state.players }
                delete newPlayers[id]
                return { players: newPlayers }
            })
        })

        set({ socket })
    },

    move: (position, rotation) => {
        const { socket, myId } = get()
        if (!socket || !myId) return

        // Optimistic update
        set(state => ({
            players: {
                ...state.players,
                [myId]: { ...state.players[myId], position, rotation },
            },
        }))

        // Send to server
        // Rate limit this in a real app, but for now direct emit is fine for local test
        socket.emit('move', { position, rotation })
    },
}))
