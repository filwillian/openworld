// Types for the Ghost SDK

export interface PlayerState {
    id: string
    position: [number, number, number]
    rotation: [number, number, number]
    avatarId?: string
}

export interface GhostState {
    players: Record<string, PlayerState>
    me: PlayerState | null
}

export interface Perception {
    location: [number, number, number]
    entities: NearbyEntity[]
    environment: string
}

export interface NearbyEntity {
    id: string
    distance: string
    position: [number, number, number]
}

export interface Decision {
    action: 'move' | 'chat' | 'idle'
    target?: [number, number, number]
    message?: string
    thought: string
}

export interface GhostOptions {
    url?: string
    name?: string
}

export interface ChatMessage {
    senderId: string
    senderName?: string
    message: string
    timestamp: number
}

// Ghost events
export interface GhostEvents {
    connected: (id: string) => void
    ready: (me: PlayerState) => void
    chat: (message: ChatMessage) => void
}
