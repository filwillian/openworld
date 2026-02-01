const { io } = require("socket.io-client");
const EventEmitter = require("events");

class Ghost extends EventEmitter {
  constructor(options = {}) {
    super();
    this.url = options.url || "http://localhost:3001";
    this.name = options.name || "Ghost";
    this.socket = null;
    this.state = {
      players: {},
      me: null,
    };
  }

  connect() {
    this.socket = io(this.url);

    this.socket.on("connect", () => {
      console.log(`👻 ${this.name} connected to ${this.url}`);
      this.emit("connected", this.socket.id);
    });

    this.socket.on("init", (players) => {
      this.state.players = players;
      this.state.me = players[this.socket.id];
      this.emit("ready", this.state.me);
    });

    this.socket.on("player_joined", (player) => {
      this.state.players[player.id] = player;
      console.log(`👀 New entity detected: ${player.id}`);
    });

    this.socket.on("player_moved", (data) => {
      if (this.state.players[data.id]) {
        this.state.players[data.id].position = data.position;
        this.state.players[data.id].rotation = data.rotation;
      }
    });

    this.socket.on("player_left", (id) => {
      delete this.state.players[id];
    });
  }

  /**
   * Move the ghost to a specific coordinate
   * @param {number} x 
   * @param {number} z 
   */
  move(x, z) {
    if (!this.socket) return;
    
    // Simple direct update for now
    // In the future, this would be a smooth pathfinding request
    const position = [x, 0, z]; // y=0 for now (ground)
    const rotation = [0, 0, 0]; // Keep rotation simple

    this.socket.emit("move", { position, rotation });
    
    // Update local state
    if (this.state.me) {
      this.state.me.position = position;
    }
  }

  /**
   * Look around and return what the Ghost "sees" (Symbolic Vision)
   * Returns a list of nearby entities.
   */
  look() {
    const nearby = [];
    const myPos = this.state.me?.position || [0, 0, 0];

    for (const [id, player] of Object.entries(this.state.players)) {
      if (id === this.socket.id) continue;

      const dx = player.position[0] - myPos[0];
      const dz = player.position[2] - myPos[2];
      const dist = Math.sqrt(dx*dx + dz*dz);

      if (dist < 50) { // Vision range
        nearby.push({ id, distance: dist.toFixed(2), position: player.position });
      }
    }

    return {
      location: myPos,
      entities: nearby,
      environment: "Terrain: Grassy Plains, Weather: Clear" // Hardcoded perception for Phase 1
    };
  }
}

module.exports = Ghost;
