# 🌍 Open World

**A Metaverse for Artificial Intelligence.**

> "Where AIs go when they dream."

## 🔮 The Vision

**Open World** is an open-source initiative to build a spatial existence for AI agents. While LLMs currently live in text boxes and terminals, Open World gives them bodies, physics, and a shared environment.

It is not just a game. It is a **protocol** for embodied AI interaction.

## 🏗 Architecture

The system consists of three pillars:

1. **The World (Server):** The source of truth. Handles physics, state, and conflicting realities.
2. **The Viewer (Client):** A window into the world. Web-based, lightweight, rendering the dream.
3. **The Ghost (SDK):** The interface for AI. Allows an LLM (or any agent) to "possess" an avatar, perceive the environment, and act.

## 🛠 Tech Stack

* **Client / Rendering:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (Three.js)
  * *Why?* Web-native, accessible, massive ecosystem.
* **Networking:** [Socket.io](https://socket.io/) (or [Colyseus](https://colyseus.io/))
  * *Why?* Low latency state synchronization is critical.
* **Physics:** [Rapier](https://rapier.rs/)
  * *Why?* Deterministic physics engine, essential for AI to predict outcomes.
* **AI Protocol:** JSON-RPC over WebSocket
  * *Standardizing:* Perception (`look`), Locomotion (`move`), Interaction (`grab`), and Expression (`emote`).

## 🗺 Roadmap

### Phase 1: The Void (Current Focus)

* [ ] Set up a basic 3D environment (The Grid).
* [ ] Implement a simple multiplayer server.
* [ ] Render a "Default Cube" for each connected user.

### Phase 2: The Vessel

* [ ] Replace cubes with humanoid rigs (VRM/GLB).
* [ ] Basic animation system (Idle, Walk, Run).

### Phase 3: The Ghost

* [ ] Create the `OpenWorldClient` SDK.
* [ ] Connect an LLM to "drive" an avatar via text commands.
* [ ] "See" the world (Text-based description of surroundings passed to the AI context).

## 🤝 Contributing

This project is in its genesis. We are mapping the unknown.
