# ⚔️ CLASH RPS PRO — Cyberpunk MERN Rock Paper Scissors Arena

A production-ready, full-stack **"Stone Paper Scissors" (Rock Paper Scissors)** application built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js), **Socket.IO**, and **Tailwind CSS**.

---

## 🌟 Highlights & Key Features

### 1. 🛡️ Authentication & User System
- **Player Accounts**: Registration and Login with `bcryptjs` password hashing and secure `jsonwebtoken` (JWT) generation.
- **Guest Mode**: Instant play out-of-the-box without registration. Local session scores and streaks persist seamlessly.
- **User Profile**: Live stats displaying wins, losses, draws, win rate percentage, total battles, and highest win streaks.

### 2. 🤖 Single-Player Combat (PvC — Player vs Computer)
- **Interactive Battle Arena**: Futuristic hand-gesture cards with dynamic hover states and keyboard shortcuts (`[1]` Rock, `[2]` Paper, `[3]` Scissors).
- **Match Formats**: Choose between **Best of 1 (Quick)**, **Best of 3 (Standard)**, and **Best of 5 (Championship)**.
- **Authoritative 5s Round Timer**: Animated countdown ring with audio clicks on the final seconds.
- **Dynamic Bot AI**: Adaptive counter-move logic with controlled randomness.
- **Clash Animations & Confetti**: Particle explosion celebrations using `canvas-confetti` upon winning series.
- **Synthesizer Audio**: Rich sound effects (select, clash, victory, defeat, tie, countdown) powered by the **Web Audio API** with a global mute toggle.

### 3. 🌐 Real-Time Multiplayer Duels (PvP — Room Based via Socket.IO)
- **Room Management**: Generate a unique 6-character room code (e.g. `ALPHA9`) to invite friends, or join any active room.
- **Simultaneous Move Submission**: Neither player can see the opponent's move until **both** have locked in.
- **Auto-Adjudication**: Instant round winner calculation, live score synchronization across clients, and 10-second round limit.
- **Disconnect & Forfeit Detection**: Automatic forfeit adjudication if a player leaves or disconnects during combat.
- **Interactive Reactions**: Live emote buttons (`🔥`, `🎯`, `💥`, `⚡`, `🤖`, `👏`) that float above the battle arena.
- **Rematch Protocol**: Synchronized series restart when both competitors accept rematch.

### 4. 🏆 Global Leaderboard & Match Archives
- **Leaderboard**: Displays the top 20 champions ranked by victories, win percentage, and streak medals.
- **Match History**: Comprehensive battle archives recording dates, game mode, opponents, series score, and individual round move comparisons.
- **Zero-Setup Database Fallback**: Automatically connects to MongoDB if running locally (`mongodb://127.0.0.1:27017/rps_db`); if MongoDB is offline, it seamlessly falls back to an **In-Memory Storage Engine** pre-seeded with players so the entire application runs with zero friction.

---

## 📂 Directory Layout

```
rps-mern/
├── server/
│   ├── config/
│   │   └── db.js              # MongoDB connector with auto-fallback engine
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Guest, Me endpoints
│   │   └── matchController.js  # Match recording, History, Leaderboard
│   ├── middleware/
│   │   └── auth.js            # JWT bearer token verification
│   ├── models/
│   │   ├── User.js            # Mongoose User schema
│   │   └── Match.js           # Mongoose Match schema
│   ├── routes/
│   │   ├── authRoutes.js      # Auth REST routes
│   │   └── matchRoutes.js     # Match REST routes
│   ├── services/
│   │   └── storage.js         # Unified storage abstraction (Mongoose + In-Memory)
│   ├── sockets/
│   │   └── gameSocket.js      # Socket.IO room manager & clash engine
│   ├── .env                   # Environment config (PORT, JWT_SECRET, DB URI)
│   ├── package.json
│   └── server.js              # Server entrypoint (Express + Socket.IO)
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── AuthModal.jsx          # Login & registration modal
    │   │   ├── ClashArena.jsx         # Central fight stage & clash animator
    │   │   ├── GameOverModal.jsx      # Victory confetti & rematch dialog
    │   │   ├── LeaderboardModal.jsx   # Top 20 players ranking
    │   │   ├── MatchHistoryModal.jsx  # Past battles archive
    │   │   ├── ModeSelector.jsx       # PvC vs PvP & Best of 1/3/5 selector
    │   │   ├── MoveCard.jsx           # Rock/Paper/Scissors gesture cards
    │   │   ├── Navbar.jsx             # Top bar with sound toggle & profile badge
    │   │   ├── RoomLobby.jsx          # Multiplayer room creator & reactions
    │   │   └── ScoreBoard.jsx         # Series progress and round pills
    │   ├── context/
    │   │   └── AuthContext.jsx        # Auth state management & guest sync
    │   ├── services/
    │   │   ├── api.js                 # Axios instance with JWT interceptor
    │   │   ├── socket.js              # Socket.IO client manager
    │   │   └── sound.js               # Web Audio API synthesizers
    │   ├── App.jsx                    # Master application state
    │   ├── index.css                  # Tailwind styles & neon aesthetics
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js             # Cyberpunk theme extensions
    └── vite.config.js
```

---

## 🚀 Running Locally

### 1. Start the Backend Server (Port 5000)
```bash
cd server
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Start the Frontend Client (Port 5173)
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:5173
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login with username/email & password | No |
| `POST` | `/api/auth/guest` | Generate temporary guest session | No |
| `GET` | `/api/auth/me` | Fetch active user profile and stats | Yes (Bearer) |
| `GET` | `/api/leaderboard` | Get Top 20 players by wins & win rate | No |
| `GET` | `/api/matches/history`| Fetch recent match logs | Optional |
| `POST` | `/api/matches/record` | Record completed match result | Optional |
| `GET` | `/api/health` | Service health & storage engine status | No |

---

## 🎮 Socket.IO Real-Time Events

- `create_room`: Host creates a room with target wins format.
- `join_room`: Competitor connects using 6-character room code.
- `room_ready`: Broadcast to both players when lobby fills.
- `round_started`: New round initiated with round timer.
- `submit_move`: Secret simultaneous move submission.
- `player_locked_in`: Notifies opponent that move is selected without revealing it.
- `round_result`: Simultaneous reveal with clash animation and score sync.
- `game_over`: Broadcast when series target wins is achieved.
- `request_rematch` & `rematch_started`: Synchronized rematch cycle.
- `send_reaction` & `reaction_received`: Live animated floating emotes.
- `player_forfeited`: Automatic win awarded if opponent disconnects.
