# Real-Time AI Quiz Platform

A production-ready, real-time quiz platform where **AI generates quiz questions on demand**. Hosts create quizzes on any topic in seconds; players join with a room code and compete live with instant leaderboard updates.

**Built for:** Teachers, event organizers, study groups, and anyone running live trivia or knowledge checks.

---

## Key Features

- **AI-generated questions** — Groq API (Llama 3.1) creates multiple-choice questions by topic, difficulty, and count; rate-limited for free tier
- **Real-time multiplayer** — Socket.IO for live sync; no page refresh
- **Live leaderboard** — Redis sorted sets for fast score updates and rankings
- **Room-based sessions** — 6-character join codes; host controls start and next question
- **Dual interfaces** — Host flow (create → lobby → run quiz → results) and player flow (join → wait → answer → results)
- **Time-based scoring** — Base points plus bonus for faster correct answers
- **Responsive UI** — Dark theme, TailwindCSS, Framer Motion; connection status indicator
- **Dockerized setup** — Backend, frontend, Redis, and Postgres (optional) via Docker Compose
- **Deploy-ready** — Root Dockerfile for single-service deploy (e.g. Render); optional split (Vercel + Render)

---

## Architecture Overview

```
┌─────────────┐     Socket.IO      ┌─────────────┐     Redis      ┌─────────────┐
│   Frontend  │ ◄────────────────► │   Backend   │ ◄────────────► │    Redis    │
│  (React)    │   real-time events │  (Express)  │  game state &  │  (in-memory)│
└─────────────┘                    └──────┬──────┘   leaderboard  └─────────────┘
                                           │
                                           │ HTTPS
                                           ▼
                                    ┌─────────────┐
                                    │  Groq API   │
                                    │ (Llama 3.1) │
                                    └─────────────┘
```

- **Frontend** — React SPA; Zustand for client state; Socket.IO client for events (`create_room`, `join_room`, `start_quiz`, `submit_answer`, `next_question`, `get_leaderboard`, etc.).
- **Backend** — Express HTTP server + Socket.IO; serves API and (in production) static frontend; validates rooms and runs game logic.
- **Redis** — Stores room state (quiz + players) and leaderboard (sorted sets); single source of truth for active games.
- **Groq API** — On-demand question generation; backend calls it when host creates a room; responses are normalized and cached in Redis per room.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, TypeScript, Vite 7, TailwindCSS, Framer Motion, Zustand, React Router, Socket.IO Client |
| **Backend** | Node.js, Express 5, Socket.IO 4, Redis client |
| **AI** | Groq API (Llama 3.1 8B Instant) |
| **Infrastructure** | Docker, Docker Compose, Redis, PostgreSQL (planned) |

---

## Project Structure

```
├── backend/                 # Node.js API + Socket.IO server
│   ├── src/
│   │   ├── index.ts         # Express app, static serving, Socket.IO mount
│   │   ├── types.ts         # Quiz, Question, Player types
│   │   ├── utils.ts         # generateRoomCode()
│   │   └── services/
│   │       ├── groq.service.ts   # Groq API + rate limit + question generation
│   │       ├── redis.service.ts  # Game state & leaderboard (Redis)
│   │       └── socket.service.ts # Socket event handlers & game flow
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React SPA
│   ├── src/
│   │   ├── App.tsx, main.tsx
│   │   ├── components/     # UI, layout, analytics, quiz
│   │   ├── pages/           # Home, Join, Host/*, Player/*
│   │   ├── store/           # Zustand (quizStore, toastStore)
│   │   ├── socket/          # Socket.IO client (VITE_SERVER_URL)
│   │   ├── hooks/           # useSocketEvents
│   │   └── routes/          # AppRoutes
│   ├── package.json
│   └── vite.config.ts
├── docker/
│   └── docker-compose.yml   # backend, frontend, redis, postgres
├── Dockerfile               # Production: frontend + backend single image (e.g. Render)
├── package.json             # Root workspace (optional)
├── README.md
├── HOW_TO_RUN.md
├── DEPLOY_RENDER.md
└── CONNECT_FRONTEND_BACKEND.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Docker & Docker Compose** (for Docker setup)
- **Groq API key** — [console.groq.com/keys](https://console.groq.com/keys)

### 1. Clone and configure environment

```bash
git clone https://github.com/YOUR_USERNAME/AI_Quiz.git
cd AI_Quiz
```

Create `backend/.env`:

```env
PORT=3000
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_your_groq_key_here
```

Optional (for future DB use): `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_quiz`

### 2. Run with Docker (recommended)

```bash
cd docker
docker-compose up --build
```

- **Frontend:** http://localhost:5173  
- **Backend:** http://localhost:3000  

### 3. Run locally (without Docker)

**Terminal 1 — Redis**

```bash
brew services start redis   # macOS
# or: redis-server
```

**Terminal 2 — Backend**

```bash
cd backend
npm install
npm run dev
```

**Terminal 3 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_SERVER_URL=http://localhost:3000` in `frontend/.env` if the frontend is not proxied to the backend.

---

## Environment Variables

| Variable | Where | Description |
|----------|--------|-------------|
| `GROQ_API_KEY` | Backend | **Required.** Groq API key for AI question generation. |
| `REDIS_URL` | Backend | Redis URL (e.g. `redis://localhost:6379` or Render Internal URL). |
| `DATABASE_URL` | Backend | Optional. PostgreSQL URL for future persistence. |
| `PORT` | Backend | Server port (default `3000`; Render sets this automatically). |
| `VITE_SERVER_URL` | Frontend | Backend URL for Socket.IO (e.g. `https://your-backend.onrender.com`). Set in Vercel for production. |

---

## Gameplay Flow

1. **Host** — Creates a quiz (topic, difficulty, number of questions). Backend calls Groq, stores quiz in Redis, returns room code.
2. **Players** — Join by entering room code and name; backend validates room and adds player to Redis; lobby updates in real time.
3. **Host** — Clicks “Start Quiz”; server emits `quiz_started`, sends first question (answer hidden from clients).
4. **Players** — Answer before timer ends; server scores (base + time bonus), updates Redis leaderboard, emits `leaderboard_update`.
5. **Host** — Advances with “Next Question”; server emits `new_question` until quiz ends.
6. **All** — Server emits `final_leaderboard` and `quiz_ended`; host and players see results.

---

## Scalability & Design Decisions

- **Redis** — In-memory state and sorted sets give sub-ms leaderboard updates and simple room key/value access; no DB round-trip per event.
- **Socket.IO** — Single long-lived connection per client; events (`create_room`, `join_room`, `submit_answer`, etc.) keep UI in sync without polling.
- **Groq** — On-demand generation keeps content fresh; rate limiting (e.g. 30 req/min) respects free tier; structured prompts produce consistent JSON for parsing.
- **Single Dockerfile** — Root Dockerfile builds frontend and backend into one image for low-friction deploy (e.g. Render); frontend can also be deployed separately (e.g. Vercel) with `VITE_SERVER_URL` pointing at the backend.

---

## Future Improvements

- **PostgreSQL** — Persist quizzes, sessions, and scores; analytics and history.
- **Analytics dashboard** — Per-quiz and per-host stats, difficulty breakdown, completion rates.
- **Test coverage** — Unit tests (Groq, Redis, scoring); integration tests for Socket flows; optional E2E.
- **Accessibility** — ARIA, keyboard navigation, focus management, clearer errors.
- **PWA** — Offline shell, better behavior on reconnect and poor network.

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Ensure the app runs via Docker or locally with Redis and a Groq key before submitting.

---

