# How to Run the AI Quiz App on Localhost (Docker) 🚀

Complete procedure to run the app using Docker on your machine.

---

## Prerequisites

- **Docker** and **Docker Compose** installed  
  - [Install Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Compose), or  
  - Docker Engine + [Docker Compose](https://docs.docker.com/compose/install/) on Linux.

- **Groq API key** (free) for generating quiz questions.

---

## Step 1: Get a Groq API key

1. Go to **[Groq Console](https://console.groq.com/keys)**.
2. Sign up or log in.
3. Click **Create API Key**.
4. Copy the key (it starts with `gsk_...`).

---

## Step 2: Configure the server environment

1. Open **`backend/.env`** in the project root (create it if it doesn’t exist).
2. Set your Groq API key:

   ```env
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

3. Save the file.  
   (Other variables like `PORT`, `REDIS_URL` are optional; Docker Compose sets what’s needed.)

---

## Step 3: Run the app with Docker

1. Open a terminal and go to the **`docker`** folder of the project:

   ```bash
   cd /path/to/AI_QUIZ/docker
   ```

   Example on Mac/Linux if the project is on your Desktop:

   ```bash
   cd ~/Desktop/AI_QUIZ/docker
   ```

2. Build and start all services:

   ```bash
   docker-compose up --build
   ```

   - First run can take a few minutes (downloading images and building frontend/backend).
   - You’ll see logs from **backend**, **frontend**, **redis**, and **postgres**.
   - Wait until you see the frontend dev server and the backend listening (e.g. “Server is running on port 3000” and Vite ready).

3. Leave this terminal open while you use the app.

---

## Step 4: Open the app in your browser

- **App (frontend):** **[http://localhost:5173](http://localhost:5173)**  
  Use this URL to create quizzes, join rooms, and play.

- **Backend API:** `http://localhost:3000`  
  (Used by the frontend; you don’t need to open it manually.)

---

## Step 5: Use the app

1. On the landing page, choose:
   - **Create Quiz** → set topic, difficulty, number of questions → **Create Room** → share the **room code**.
   - **Join Quiz** → enter the **room code** and your **name** → **Join Quiz**.

2. **Host:** In the lobby, click **Start Quiz**, then use **Next Question** and watch the live leaderboard.

3. **Players:** Wait in the lobby until the host starts, then answer questions. Timer auto-submits when it hits zero.

4. When the quiz ends, both host and players see the final leaderboard.

---

## Stopping the app

- In the terminal where `docker-compose up` is running, press **`Ctrl + C`**.
- To stop and remove the containers (optional):

  ```bash
  cd /path/to/AI_QUIZ/docker
  docker-compose down
  ```

- To also remove the database volume (resets all data):

  ```bash
  docker-compose down -v
  ```

---

## Quick reference

| What              | Command / URL |
|-------------------|---------------|
| Start app         | `cd docker` then `docker-compose up --build` |
| App in browser     | http://localhost:5173 |
| Backend           | http://localhost:3000 |
| Stop              | `Ctrl + C` in the terminal |
| Stop + remove     | `docker-compose down` |

---

## Troubleshooting

- **“Groq API Key loaded: Not Found”**  
  - Ensure **`backend/.env`** exists and contains **`GROQ_API_KEY=gsk_...`**.  
  - Restart: `docker-compose down` then `docker-compose up --build`.

- **“Failed to create room” / “Quota exceeded”**  
  - Check your Groq key and quota at [Groq Console](https://console.groq.com/).  
  - The app limits to 30 quiz generations per minute.

- **Port already in use**  
  - If **5173** or **3000** is taken, either stop the other app or change the port in **`docker/docker-compose.yml`** (e.g. `"5174:5173"` for the frontend).

- **Clean rebuild**  
  ```bash
  cd docker
  docker-compose down
  docker-compose build --no-cache
  docker-compose up
  ```

---

**Note:** The app uses Redis and Postgres in Docker; no need to install them on your machine.
