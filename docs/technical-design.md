# Bone Thief - Technical Design MVP

## Scope

This document translates `docs/game-spec.md` into an implementable MVP:

- Frontend: React + Vite + TypeScript.
- Backend: Java 21, Spring Boot 3.x.
- Realtime: WebSocket/STOMP.
- Storage: in-memory repository backed by `ConcurrentHashMap`.
- Theme: dogs in a yard looking for the missing bone.

The backend is the source of truth for rooms, roles, phases, legal actions, votes, and results. The frontend never derives hidden information from public state.

## Repository Layout

```text
backend/
  pom.xml
  mvnw
  mvnw.cmd
  src/main/java/com/bonethief/
    BoneThiefApplication.java
    config/
    controller/
    domain/model/
    dto/
    exception/
    repository/
    service/
    websocket/
  src/main/resources/application.yml

frontend/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  public/
  src/
    api/
    components/
    config.ts
    types.ts
    App.tsx
    main.tsx
    styles.css

docs/
  game-spec.md
  technical-design.md
```

## Backend Layers

### `controller`

REST entry points only. Controllers validate request shape lightly, delegate to services, and return DTOs.

Endpoints:

- `POST /api/rooms`
- `POST /api/rooms/{roomCode}/join`
- `GET /api/rooms/{roomCode}`
- `GET /api/rooms/{roomCode}/players/{playerId}/private-state`
- `POST /api/rooms/{roomCode}/settings`
- `POST /api/rooms/{roomCode}/display-name`
- `POST /api/rooms/{roomCode}/start`
- `POST /api/rooms/{roomCode}/restart`

### `websocket`

STOMP message handlers and player identity binding.

Endpoint:

- `/ws?playerId={playerId}`

Subscribe:

- `/topic/rooms/{roomCode}` for public room state.
- `/user/queue/private-state` for one player's private state.
- `/user/queue/errors` for action errors.

Send:

- `/app/rooms/{roomCode}/ready`
- `/app/rooms/{roomCode}/start`
- `/app/rooms/{roomCode}/action`

The WebSocket handshake uses the `playerId` query parameter as a lightweight MVP principal. This lets the backend call `convertAndSendToUser(playerId, "/queue/private-state", ...)`.

### `service`

Owns game use cases:

- Create/join room.
- Update room settings.
- Start/restart game.
- Compute public DTO.
- Compute private DTO.
- Validate and apply actions.
- Publish public/private updates.
- Schedule and resolve phase deadlines.

No gameplay rule lives in controllers.

### `domain/model`

In-memory domain state:

- `Room`
- `Player`
- `RoomSettings`
- `GameState`
- `GamePhase`
- `Role`
- `PlayerActionType`
- `GameResult`
- `PeekResult`
- `RoomLanguage`

Domain objects are mutable inside synchronized service blocks. DTOs are immutable records.

### `repository`

MVP repository:

- `RoomRepository`
- `InMemoryRoomRepository`

Implementation uses `ConcurrentHashMap<String, Room>`. The interface keeps room persistence swappable later for PostgreSQL/Redis.

## Core Domain Decisions

### Player Count

Rooms support 4-8 players. A game can start only when `players.size() == settings.maxPlayers`.

### Night Progression

The backend tracks `currentHour` from 1 to 6.

For 4-player games, the game enters `WAKE_SELECTION` before the night clock starts:

- Bone Thief keeps both secret dice as effective wake times and may wait on the earlier wake time if a later one exists.
- Each Yard Dog receives 2 secret dice but must choose exactly 1 effective wake time through `SELECT_WAKE_TIME`.
- `diceRolls` remains the private raw clue. `wakeTimes` is the effective schedule used by night progression.
- Peek results reveal the target's raw `diceRolls`, not only the chosen effective wake time.

Wake dice generation must cap the worst-case number of players who can wake together:

- Formula: `maxAwakeTogether < playerCount - plannedPackmateCount`.
- Implementation cap: `playerCount - plannedPackmateCount - 1`.
- Planned Packmate counts: 4 players = 0, 5 players = 1 potential Packmate, 6 players = 1, 7 players = 2, 8 players = 2.
- Resulting caps: 4 players = 3, 5 players = 3, 6 players = 4, 7 players = 4, 8 players = 5.
- In 4-player games, the cap is checked against raw `diceRolls` per Dog so any later Yard Dog choices still respect the worst-case limit.

At each hour:

- A player is awake when their private `wakeTimes` contains `currentHour`.
- Awake players receive legal action buttons in private state.
- Sleeping players only see public phase/hour.
- The backend always announces all 6 hours from `1:00pm` to `6:00pm`.
- Each hour lasts the configured night duration, default `10` seconds.
- Manual actions such as `WAIT`, `PEEK_WAKE_TIME`, and `TAKE_BONE` never shorten the current hour.
- If no one is awake at an hour, the public hour still runs until its deadline.
- When Bone Thief takes the bone, only Bone Thief is marked done automatically. Other awake players receive a private witness clue and keep their remaining action/time until they wait or the hour times out.

Each hour has a room setting deadline, default `10` seconds. When the deadline expires:

- Yard Dogs auto-wait and lose their peek opportunity.
- Bone Thief auto-takes the bone unless this is a 4-player game and the thief still has a later wake hour.
- In the 4-player case, Bone Thief may wait on the earlier wake hour and must take the bone on the final eligible wake hour.

### Timer Settings

The game uses backend-owned countdowns so rooms cannot hang when a player leaves a tab idle.

| Phase | Duration | Configurable | Timeout behavior |
| --- | --- | --- | --- |
| Wake Selection | No timer in MVP | No | 4-player Yard Dogs must choose 1 effective wake time before the night starts. |
| Night hour | `settings.nightSeconds`, default `10` seconds | Yes, host can edit before start | Awake Yard Dogs auto-wait. Bone Thief auto-takes only when required by the final-wake rule. |
| Pack Selection | `settings.packSelectionSeconds`, default `10` seconds | Yes, host can edit before start | If Bone Thief has not selected enough Packmates, backend randomly shuffles valid candidates and selects enough from that list. |
| Discussion | `(playerCount - 1) * 60` seconds | No in MVP | Backend automatically moves the room to Voting. |
| Voting | `60` seconds | No in MVP | Backend locks voting and resolves immediately. Missing votes become blank votes. |

The Discussion formula is measured in minutes: 5 players get 4 minutes, 8 players get 7 minutes.

The server publishes `serverTimeEpochMs` and `phaseDeadlineEpochMs` in public room state. The frontend displays countdowns from those values, but the backend is authoritative and advances phases through a scheduled timer version. Stale timers are ignored when players act early and the phase changes.

Missing votes are blank votes. They appear in the result vote table, but they do not count toward any target during vote resolution.

### Night Actions

Supported action types:

- `SELECT_WAKE_TIME`
- `TAKE_BONE`
- `PEEK_WAKE_TIME`
- `WAIT`
- `SELECT_PACKMATE`
- `START_VOTE`
- `VOTE`

`WAIT` is an implementation helper so awake Yard Dogs can explicitly skip when no useful action is available.

### Packmate Rules

- 5 players: if Bone Thief takes the bone while Yard Dogs are awake in the same hour, one witness becomes Packmate. One witness is automatic; multiple witnesses trigger `PACK_SELECTION`.
- Witnesses receive private `witnessedBoneTakenHours` and are not auto-completed merely because the bone was taken.
- During 5-player witness `PACK_SELECTION`, public state still appears as `NIGHT_HOUR`; witness private messages explain that a secret choice is being resolved and the hour will continue.
- 6 players: after hour 6, Bone Thief selects 1 Packmate. They know each other.
- 7 players: after hour 6, Bone Thief selects 2 Packmates. The Packmates know each other, but their private state does not reveal Bone Thief.
- 8 players: after hour 6, Bone Thief selects 2 Packmates. Bone Thief and Packmates know each other.

### Vote Resolution

In `VOTING`, each player votes for another player. Vote targets are hidden until every player has voted. The highest vote getter(s) are revealed.

If the voting deadline expires, the backend resolves immediately. Missing votes stay blank so the room cannot become stuck without creating fake vote targets.

- Yard Pack wins if Bone Thief is among revealed players.
- Thief Pack wins if Bone Thief is not revealed.

## DTO Privacy Rules

### Public Room DTO

Allowed before result:

- Room code.
- Phase.
- Current hour.
- Host id.
- Room settings.
- Public player list.
- Ready/action/vote completion status.
- Whether the bone is known missing after night.
- `serverTimeEpochMs` and `phaseDeadlineEpochMs`.
- Public player ids such as `DOG1`, never raw session `playerId`.

Forbidden before result:

- Roles.
- Wake times.
- Peek results.
- Packmate identity.
- Vote targets.
- Raw `playerId` values for other players.

For 5-player witness-based Pack Selection, the internal phase is `PACK_SELECTION`, but public state continues to look like `NIGHT_HOUR` so sleeping players do not learn that a witness selection happened.

At `RESULT`, public DTO may include final reveal data, vote table, Bone Thief, Packmates, and winning pack.

### Private State DTO

Sent only to the owning `playerId`:

- Own role.
- Own raw `playerId` and own public id.
- Own wake times.
- Own raw dice rolls.
- Hours where this player witnessed the bone being taken.
- Co-awake history: hours where this player woke with other Dogs, with only those peer public ids/nicknames.
- Whether player is awake now.
- Awake player list only when the player is awake.
- Legal actions.
- Peek results.
- Known allies when the rules allow it.
- Known Bone Thief only when the rules allow it.

Target lists in private state use public ids, and the backend resolves those ids internally.

## Frontend Design

### State

The browser stores:

- `boneThief.roomCode`
- `boneThief.playerId`
- `boneThief.nickname`

On refresh:

1. Load stored ids.
2. Fetch public room state.
3. Fetch private state.
4. Reconnect STOMP with `?playerId=...`.

### Screens

- `HomePage`: create/join room.
- `LobbyPage`: player list, host settings, ready/start controls, display-name change.
- `GamePage`: phase, public yard state, action controls.
- `PrivatePanel`: Kennel information.
- `ResultPage`: winner, roles, votes, restart.

Room settings exposed in the MVP:

- Max players.
- Night seconds.
- Pack Selection seconds.
- Language: `VI` or `EN`.
- Optional room password.

Changing password to a blank value removes the room password. Password is only required when joining a protected lobby room and is never returned in public state.

### Config

`frontend/src/config.ts` reads:

- `VITE_API_BASE_URL`, default `http://localhost:8080`
- `VITE_WS_BASE_URL`, default derived as `ws://localhost:8080/ws`

This keeps deploy targets configurable for Vercel/GitHub Pages.

## Error Handling

REST errors return JSON:

```json
{
  "message": "Readable error",
  "status": 400
}
```

WebSocket action errors are sent to `/user/queue/errors`.

## MVP TODOs

- Add real discussion chat if needed.
- Add Redis-backed room state for horizontal scaling.
- Replace `playerId` principal with signed session token.
- Add Dockerfile and production reverse-proxy config.
- Add the optional special role variant under a new dog-themed role name.
