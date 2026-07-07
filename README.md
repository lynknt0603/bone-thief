# Bone Thief

A room-based multiplayer web game themed around dogs in a yard trying to find who stole the bone.

- **Frontend**: React + Vite + TypeScript.
- **Backend**: Spring Boot 3.x, Java 21.
- **Realtime**: WebSocket/STOMP.
- **Storage MVP**: In-memory `ConcurrentHashMap`.

## Structure

```text
backend/   Spring Boot REST + STOMP server
frontend/  React Vite client
docs/      Gameplay spec and technical design
image/     Original assets added to the workspace
```

## Running Locally

### Backend

Requires Java 21 or higher and Maven in your `PATH`.

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell, use:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The backend runs on `http://localhost:8080` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default (or `/bone-thief/` subpath if configured).

## Build

Backend:

```bash
cd backend
./mvnw package
```

Frontend:

```bash
cd frontend
npm run build
```

The build output of the frontend is located in `frontend/dist`.

## Backend URL Configuration

The frontend reads the following Vite environment variables:

```bash
VITE_API_BASE_URL=https://your-backend.example.com
VITE_WS_BASE_URL=wss://your-backend.example.com/ws
```

If these environment variables are not set:

- `VITE_API_BASE_URL` defaults to `http://localhost:8080`
- `VITE_WS_BASE_URL` is automatically inferred as `ws://localhost:8080/ws`

For Vercel, set these variables in Project Settings. For GitHub Pages, set them during the build workflow or in an environment file before running `npm run build`.

## Deploying Frontend

### Vercel

1. Import the project.
2. Select `frontend` as the root directory.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Set `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` to point to your deployed backend.

### GitHub Pages

1. Run `npm run build` inside the `frontend` directory.
2. Publish the `frontend/dist` directory.
3. If deploying under a subpath of the repository, configure the `base` path in `frontend/vite.config.ts` before building.
4. Set the backend URL via environment variables in the build workflow.

## Gameplay MVP

- Create and join rooms using room codes.
- Optional room password.
- Host can configure 4-8 Dogs.
- Host can configure language, night hour duration, and teammate selection duration.
- Each player can change their display name in the lobby.
- Host can start the game once the room is full and everyone is ready.
- Backend handles role assignment, waking hours, night phase, teammate selection, discussion, voting, and results.
- Server-side timers:
  - Night: defaults to 10 seconds per hour.
  - Teammate selection: defaults to 10 seconds.
  - Discussion: minutes = number of players - 1.
  - Vote: 60 seconds.
- Public state does not expose roles, waking hours, peek results, or vote targets before the Result phase.
- Public state only uses public IDs like `DOG1`, hiding other players' session `playerId`s.
- Private state is sent individually to each player via `/user/queue/private-state`.
- Replay button available in the same room after the Result phase.

## Asset Notes

The image `image/boner-thief.png` is copied directly to `frontend/public/boner-thief.png` for use as additional artwork. The MVP does not require slicing the image into separate cards.
