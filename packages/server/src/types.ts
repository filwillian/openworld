// Shared types for Open World Server

export interface PlayerState {
    id: string
    position: [number, number, number]
    rotation: [number, number, number]
    avatarId: string
}

export interface MoveData {
    position: [number, number, number]
    rotation: [number, number, number]
}

export interface ChatMessage {
    senderId: string
    senderName?: string
    message: string
    timestamp: number
}

// Socket.io event types
export interface ServerToClientEvents {
    init: (players: Record<string, PlayerState>) => void
    player_joined: (player: PlayerState) => void
    player_moved: (data: { id: string } & MoveData) => void
    player_left: (id: string) => void
    chat: (message: ChatMessage) => void
}

export interface ClientToServerEvents {
    move: (data: MoveData) => void
    chat: (message: string) => void
}

export interface InterServerEvents {
    // For future scaling
}

export interface SocketData {
    name?: string
}
