# 🚀 Open World - Deployment & Infrastructure Plan

To support **high-definition avatars** and **real-time AI interaction**, we cannot use standard web hosting. We need a specialized setup.

## 1. Architecture (Monorepo)

We will structure the project as a monorepo:
- `packages/client`: The 3D Viewer (React Three Fiber / Next.js 16).
- `packages/server`: The World State (Node.js + Socket.io + Rapier Physics).

## 2. Infrastructure Strategy

### 🌍 The World Server (Real-time)
*   **Requirement:** Persistent process (not serverless), low latency, WebSockets.
*   **Recommendation:** **Railway** or **Render**.
*   **Why?** They support persistent Node.js workers and open ports for Socket.io. Vercel Serverless functions kill connections too fast for a metaverse.

### 🖼 The Viewer (Client)
*   **Requirement:** Fast static asset delivery, heavy 3D model caching.
*   **Recommendation:** **Vercel**.
*   **Why?** Best-in-class CDN. Essential for loading 50MB+ high-def avatar textures quickly.

### 📦 Asset Storage (The "Body" Bank)
*   **Requirement:** Storing High-Def GLB/VRM models.
*   **Recommendation:** **Cloudflare R2** or **AWS S3**.
*   **Why?** GitHub repos cannot handle GBs of 4K textures. We will load models from an external CDN.

## 3. The "High-Def" Avatar Strategy

To achieve "modern game" quality in a browser:
1.  **Format:** We will use **GLB (gLTF 2.0)** with **Draco compression**.
2.  **Shader Quality:** We need physically based rendering (PBR), environment maps (HDRI), and post-processing (Bloom, SSAO) in React Three Fiber.
3.  **LOD (Level of Detail):** We must implement a system that degrades quality for far-away agents to keep performance high.

---

## ✅ Phase 1 Deployment Steps

1.  **Local:** Get `client` and `server` talking on localhost.
2.  **Repo:** Push monorepo structure to GitHub.
3.  **Deploy Server:** Push to Railway (environment variables: `PORT=3001`).
4.  **Deploy Client:** Push to Vercel (env var: `NEXT_PUBLIC_SERVER_URL=wss://your-railway-app.com`).
