import { io, Socket } from 'socket.io-client'
import { EventEmitter } from 'events'
import {
    PlayerState,
    GhostState,
    Perception,
    GhostOptions,
    ChatMessage,
} from './types'

export class Ghost extends EventEmitter {
    private url: string
    private name: string
    private socket: Socket | null = null
    private state: GhostState = {
        players: {},
        me: null,
    }

    constructor(options: GhostOptions = {}) {
        super()
        this.url = options.url || 'http://localhost:3001'
        this.name = options.name || 'Ghost'
    }

    connect(): void {
        this.socket = io(this.url)

        this.socket.on('connect', () => {
            console.log(`👻 ${this.name} connected to ${this.url}`)
            this.emit('connected', this.socket!.id)
        })

        this.socket.on('init', (players: Record<string, PlayerState>) => {
            this.state.players = players
            this.state.me = players[this.socket!.id!] || null
            this.emit('ready', this.state.me)
        })

        this.socket.on('player_joined', (player: PlayerState) => {
            this.state.players[player.id] = player
            console.log(`👀 New entity detected: ${player.id}`)
        })

        this.socket.on(
            'player_moved',
            (data: {
                id: string
                position: [number, number, number]
                rotation: [number, number, number]
            }) => {
                if (this.state.players[data.id]) {
                    this.state.players[data.id].position = data.position
                    this.state.players[data.id].rotation = data.rotation
                }
            },
        )

        this.socket.on('player_left', (id: string) => {
            delete this.state.players[id]
        })

        this.socket.on('chat', (message: ChatMessage) => {
            if (message.senderId !== this.socket?.id) {
                console.log(
                    `💬 Received: "${message.message}" from ${message.senderId}`,
                )
            }
            this.emit('chat', message)
        })
    }

    /**
     * Move the ghost to a specific coordinate
     */
    move(x: number, z: number): void {
        if (!this.socket) return

        const position: [number, number, number] = [x, 0, z] // y=0 for now (ground)
        const rotation: [number, number, number] = [0, 0, 0]

        this.socket.emit('move', { position, rotation })

        if (this.state.me) {
            this.state.me.position = position
        }
    }

    /**
     * Send a chat message to the world
     */
    say(message: string): void {
        if (!this.socket) return
        console.log(`🗣️ Saying: "${message}"`)
        this.socket.emit('chat', message)
    }

    /**
     * Send a voice/audio payload to the world (relayed by the server)
     */
    sendAudio(buffer: ArrayBuffer | Uint8Array): void {
        if (!this.socket) return
        this.socket.emit('audio', buffer)
    }

    /**
     * Look around and return what the Ghost "sees" (Symbolic Vision)
     */
    look(): Perception {
        const nearby: Perception['entities'] = []
        const myPos =
            this.state.me?.position || ([0, 0, 0] as [number, number, number])

        for (const [id, player] of Object.entries(this.state.players)) {
            if (id === this.socket?.id) continue

            const dx = player.position[0] - myPos[0]
            const dz = player.position[2] - myPos[2]
            const dist = Math.sqrt(dx * dx + dz * dz)

            if (dist < 50) {
                nearby.push({
                    id,
                    distance: dist.toFixed(2),
                    position: player.position,
                })
            }
        }

        return {
            location: myPos,
            entities: nearby,
            environment: 'Terrain: Grassy Plains, Weather: Clear',
        }
    }

    /**
     * Get the current state
     */
    getState(): GhostState {
        return this.state
    }

    /**
     * Get Socket ID
     */
    getId(): string | undefined {
        return this.socket?.id
    }
}

export default Ghost
