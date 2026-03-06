# Real-Time AI Quiz Platform 🧠

A production-ready, scalable real-time quiz platform where questions are **generated dynamically using the Groq API**. Built for classrooms, events, and multiplayer trivia—host creates a quiz on any topic, players join with a code, and everyone competes in real time with a live leaderboard.

---

## 📌 End-Term Goal

**Vision:** A full-featured, real-time AI quiz platform that:

- Lets **hosts** create custom quizzes on any topic in seconds (AI-generated questions).
- Lets **players** join via a simple room code and play together on any device.
- Delivers **instant feedback**, live leaderboards, and a smooth, engaging experience.
- Scales to **100+ concurrent users** with Redis-backed game state.
- (Future) Persists **quiz history and analytics** in PostgreSQL for hosts and educators.

**Target users:** Teachers, event organizers, study groups, and anyone running live trivia or knowledge checks.

---

## ✅ What Has Been Done

### Backend (Node.js + Express + Socket.IO)

| Feature | Status | Description |
|--------|--------|-------------|
| **Groq AI integration** | ✅ Done | Generate multiple-choice questions by topic, difficulty, and count. Uses `llama-3.1-8b-instant`, rate-limited to 30 req/min for free tier. |
| **Rate limiting** | ✅ Done | In-memory sliding window (30 requests per 60s) with retry/backoff on 429. |
| **Socket.IO server** | ✅ Done | Real-time events: `create_room`, `join_room`, `start_quiz`, `submit_answer`, `next_question`, `get_leaderboard`. |
| **Redis game state** | ✅ Done | Room state (quiz + players) in Redis; leaderboard via sorted sets (`zIncrBy` / `zRangeWithScores`). |
| **Room lifecycle** | ✅ Done | 6-character alphanumeric room codes, host-only start/next, player join validation (room exists, quiz not started). |
| **Scoring** | ✅ Done | Base 100 pts + time bonus (5 × seconds left). Correct answer updates Redis leaderboard. |
| **Final leaderboard** | ✅ Done | On quiz end, server sends `final_leaderboard` (names + scores) to room. |

### Frontend (React + Vite + TypeScript)

| Feature | Status | Description |
|--------|--------|-------------|
| **Home page** | ✅ Done | Landing with “Create Quiz” and “Join Quiz” actions. |
| **Host flow** | ✅ Done | Create room (topic, difficulty, question count) → show join code → wait for players → Start Quiz → show current question + live leaderboard → Next Question → final standings. |
| **Player flow** | ✅ Done | Enter room code + name → wait for start → answer questions with countdown timer → see own rank/score at end. |
| **Real-time sync** | ✅ Done | Zustand store + Socket.IO client; listens for `quiz_started`, `new_question`, `leaderboard_update`, `final_leaderboard`, `quiz_ended`. |
| **UI/UX** | ✅ Done | Dark theme, TailwindCSS, Framer Motion animations, responsive layout, connection status indicator. |

### DevOps & Run

| Item | Status |
|------|--------|
| **Docker Compose** | ✅ Done | `backend`, `frontend`, `redis`, `postgres` (Postgres wired for future use). |
| **Environment** | ✅ Done | `backend/.env` for `GROQ_API_KEY`, `REDIS_URL`, `DATABASE_URL`, `PORT`. |
| **HOW_TO_RUN.md** | ✅ Done | Beginner-friendly steps: get Groq key, set `.env`, run Docker, open app. |

### Not Yet Implemented (Planned)

- **PostgreSQL:** DB is in Docker and `DATABASE_URL` is set; no tables or APIs yet for quiz history or analytics.
- **Leaderboard push during quiz:** Host can request via `get_leaderboard`; automatic push after each answer is optional enhancement.
- **Tests:** Placeholder `npm test` in server; no test suite yet.

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React 19, Vite 7, TypeScript, TailwindCSS 4, Framer Motion, Zustand, React Router, Socket.IO Client |
| **Backend** | Node.js, Express 5, Socket.IO 4, Redis (node client) |
| **AI** | Groq API (LLM for question generation) |
| **Data** | Redis (game state + leaderboard), PostgreSQL (planned for history) |
| **DevOps** | Docker, Docker Compose |

---

## 📂 Project Structure

```
AI_QUIZ/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.tsx         # Routes, nav, connection status
│   │   ├── components/
│   │   │   ├── HostDashboard.tsx   # Host: create → lobby → quiz → leaderboard
│   │   │   └── PlayerView.tsx      # Player: join → wait → play → results
│   │   └── store/
│   │       └── quizStore.ts        # Zustand + Socket.IO (room, quiz, leaderboard)
│   └── package.json
├── backend/                 # Node backend
│   ├── src/
│   │   ├── index.ts        # Express + HTTP server + Socket.IO mount
│   │   ├── types.ts        # Question, Quiz, Player
│   │   ├── utils.ts        # generateRoomCode()
│   │   └── services/
│   │       ├── groq.service.ts    # Groq API + rate limit + generateQuizQuestions()
│   │       ├── redis.service.ts   # get/set game state, leaderboard
│   │       └── socket.service.ts  # Socket events + game flow
│   ├── .env                # GROQ_API_KEY, REDIS_URL, DATABASE_URL, PORT
│   └── package.json
├── docker/
│   └── docker-compose.yml  # backend, frontend, redis, postgres
├── README.md               # This file
└── HOW_TO_RUN.md          # Simple run instructions
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** 18+
- **Docker & Docker Compose**
- **Groq API key** from [Groq Console](https://console.groq.com/keys)

### 1. Configure environment

Create or edit `backend/.env`:

```env
PORT=3000
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_quiz
GROQ_API_KEY=gsk_your_key_here
```

### 2. Run with Docker (recommended)

```bash
cd docker
docker-compose up --build
```

Then open **http://localhost:5173** in your browser.

### 3. Run locally (without Docker)

**Terminal 1 – Redis** (required):

```bash
# e.g. macOS with Homebrew
brew services start redis
# or: redis-server
```

**Terminal 2 – Backend:**

```bash
cd backend
npm install
npm run dev
```

**Terminal 3 – Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend: **http://localhost:5173** — set `VITE_SERVER_URL=http://localhost:3000` if needed (e.g. in `frontend/.env`).

---

## 🔑 Environment Variables

| Variable | Where | Description |
|----------|--------|-------------|
| `GROQ_API_KEY` | backend | Required. Groq API key for question generation. |
| `REDIS_URL` | backend | Redis connection URL (default `redis://localhost:6379`). |
| `DATABASE_URL` | backend | PostgreSQL URL (for future persistence). |
| `PORT` | backend | HTTP/Socket server port (default `3000`). |
| `VITE_SERVER_URL` | frontend | Socket.IO server URL (default `http://localhost:3000`). |

---

## 🧪 Testing

```bash
cd backend && npm test
```

*(Currently a placeholder; test suite to be added.)*

---

## 📜 License

MIT
