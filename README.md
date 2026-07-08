# Bone Thief

A realtime multiplayer deduction web game where dogs in a yard collaborate to find the Bone Thief.

---

## Technology Stack

- Frontend: React, Vite, TypeScript, Vanilla CSS
- Backend: Spring Boot 3.x, Java 21, WebSockets/STOMP (realtime messaging)
- Database MVP: In-memory storage (ConcurrentHashMap with synchronized locks)

---

## Project Structure

- backend/: Spring Boot REST + STOMP WebSocket server
- frontend/: React Vite client
- docs/: Gameplay specification and technical design docs
- image/: Original game assets

---

## Quick Start

### 1. Backend Server
Requires Java 21 or higher and Maven.

```bash
cd backend
# Windows PowerShell
.\mvnw.cmd spring-boot:run
# Unix / macOS
./mvnw spring-boot:run
```
Backend HTTP server starts on http://localhost:8080.

### 2. Frontend Client
Requires Node.js.

```bash
cd frontend
npm install
npm run dev
```
Frontend development server runs on http://localhost:5173.

---

## Configuration & Deployment

### Environment Variables
Set the following variables in the frontend environment (defaults to localhost if omitted):
- VITE_API_BASE_URL: Backend HTTP API Endpoint (e.g., https://api.example.com)
- VITE_WS_BASE_URL: Backend WebSocket Connection URL (e.g., wss://api.example.com/ws)

### Production Build
- Backend: `cd backend && ./mvnw package` (Generates executable JAR)
- Frontend: `cd frontend && npm run build` (Outputs static bundle in frontend/dist)

---

## Gameplay Features

- Lobby Management: Room codes, optional password protection, custom player avatars, and host controls (kick, room settings).
- Server-driven State Machine: Strictly timed phases (Night hours, Teammate selection, Discussion, Anonymous Voting, and Results).
- Privacy & Masking: Sensitive data (roles, secret wake times, clues) is filtered from public state updates. Player session IDs are masked using public IDs (e.g., DOG1).
- Instant Replay: Host can reset and start a new round in the same room directly from the Result page.

---

## Design Decisions

- Native Java Records over Lombok: Adopted Java 21 native Records for all DTOs instead of introducing Lombok. This ensures compile-time safety, absolute immutability for data transfer, and zero external boilerplate dependencies.
- Frontend Stack Choices:
  - Vite: Selected for sub-second hot module replacement (HMR) and instantaneous dev server startup.
  - TypeScript: Crucial for type safety when mapping complex realtime WebSocket payloads to state models.
  - Vanilla CSS: Chosen to gain total control over custom micro-animations, glassmorphism UI layouts, and styling tokens without bundle bloat from CSS frameworks.
