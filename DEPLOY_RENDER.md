# Deploy AI Quiz on Render (Docker)

Step-by-step guide to deploy the app on [Render](https://render.com) using the root **Dockerfile**. One Web Service runs both the API and the React frontend; Redis and PostgreSQL are added as Render services.

---

## Prerequisites

- **GitHub (or GitLab/Bitbucket)** account
- **Render** account: [dashboard.render.com](https://dashboard.render.com)
- **Groq API key** (free): [console.groq.com/keys](https://console.groq.com/keys)
- Code pushed to a **Git** repo (Render deploys from the repo)

---

## Step 1: Push your code to GitHub

If the project is not in a Git repo yet:

```bash
cd /path/to/AI_QUIZ
git init
git add .
git commit -m "Initial commit for Render deploy"
```

Create a new repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Render will use this repo to build and deploy.

---

## Step 2: Create a PostgreSQL database on Render

1. In the [Render Dashboard](https://dashboard.render.com), click **+ New** → **PostgreSQL**.
2. Set:
   - **Name**: e.g. `ai-quiz-db`
   - **Region**: choose one (e.g. Oregon); use the **same region** for the Web Service later.
   - **PostgreSQL version**: 15 (or default).
   - **Plan**: Free or paid.
3. Click **Create Database**.
4. When it shows **Available**, open the database → **Connect** (top right).
5. Copy the **Internal Database URL** (use this for the Web Service in the same region).

You will paste this as `DATABASE_URL` in the Web Service env (Step 5).

---

## Step 3: Create a Redis (Key Value) instance on Render

1. In the Dashboard, click **+ New** → **Key Value** (Redis).
2. Set:
   - **Name**: e.g. `ai-quiz-redis`
   - **Region**: **same as the PostgreSQL database** (and later Web Service).
3. Click **Create Key Value**.
4. When it’s ready, open the instance and copy the **Internal URL** (e.g. `redis://red-xxx:6379`).

You will use this as `REDIS_URL` in the Web Service env (Step 5).

---

## Step 4: Create the Web Service (Docker)

1. In the Render Dashboard, click **+ New** → **Web Service**.
2. **Connect** your GitHub (or GitLab/Bitbucket) account if needed, then select the **AI_QUIZ** repository.
3. Configure the service:
   - **Name**: e.g. `ai-quiz`
   - **Region**: **same as PostgreSQL and Redis** (e.g. Oregon).
   - **Branch**: `main` (or your default branch).
   - **Root Directory**: leave blank (Dockerfile is at repo root).
   - **Runtime**: **Docker** (important).
   - **Dockerfile Path**: `./Dockerfile` (or leave default if it detects the root Dockerfile).
4. **Instance type**: Free or paid, as you prefer.

Do **not** click Deploy yet; add environment variables first (Step 5).

---

## Step 5: Set environment variables

In the same Web Service → **Environment** tab (or during creation), add:

| Key             | Value / source |
|-----------------|----------------|
| `PORT`          | Leave as Render default (10000) or leave unset. |
| `DATABASE_URL`  | **Internal Database URL** from your Postgres (Step 2). |
| `REDIS_URL`     | **Internal URL** from your Redis (Step 3). |
| `GROQ_API_KEY`  | Your Groq API key (e.g. `gsk_...`). |

- **DATABASE_URL**: paste the **Internal** URL from Postgres (starts with `postgresql://`).
- **REDIS_URL**: paste the **Internal** Redis URL (e.g. `redis://red-xxx:6379`).
- **GROQ_API_KEY**: from [Groq Console](https://console.groq.com/keys).

Mark `GROQ_API_KEY` as **Secret** if the UI offers it. Save the environment.

---

## Step 6: Deploy

1. Click **Create Web Service** (or **Deploy** if you already created it).
2. Render will:
   - Clone the repo
   - Build the image using the root **Dockerfile**
   - Start the container with `node dist/index.js`
3. Wait until the deploy status is **Live** and the log shows something like: `Server is running on port 10000`.

---

## Step 7: Open the app

- Your app URL will be: **`https://<your-service-name>.onrender.com`**
- Open that URL in a browser; you should see the AI Quiz UI. Creating/joining quizzes and sockets will use the same origin (no extra CORS or URL config).

---

## Optional: Custom domain

1. In the Web Service → **Settings** → **Custom Domains**, add your domain.
2. Follow Render’s instructions to add the CNAME (or A) record in your DNS.

---

## Optional: Database migrations / schema

If your app expects tables (e.g. for quiz history), ensure they are created. Options:

- Run SQL manually in the Render Postgres **Shell** (from the database page).
- Or add a **Pre-Deploy Command** in the Web Service that runs migrations (e.g. a script that uses `psql` or your migration tool). For the current Docker setup, that would require adding the migration step inside the image or as a separate job; otherwise run migrations once from your machine using the **External** Postgres URL.

---

## Summary

| Item            | Where |
|-----------------|--------|
| Repo            | GitHub/GitLab/Bitbucket (with root `Dockerfile`) |
| Postgres        | Render **PostgreSQL** → Internal URL → `DATABASE_URL` |
| Redis           | Render **Key Value** → Internal URL → `REDIS_URL` |
| Web Service     | **Docker** runtime, root `Dockerfile`, env vars above |
| App URL         | `https://<service-name>.onrender.com` |

---

## Troubleshooting

- **Build fails**
  - Ensure the **Dockerfile** is at the repo root and the path in Render is `./Dockerfile`.
  - Check the build logs; often it’s a missing file (e.g. `frontend/` or `backend/` not present in the repo).

- **App crashes or “Cannot connect”**
  - Confirm **DATABASE_URL** and **REDIS_URL** use the **Internal** URLs and that the Web Service is in the **same region** as Postgres and Redis.
  - Check the **Logs** tab of the Web Service for connection errors.

- **“Groq API Key not found” / quiz creation fails**
  - Add **GROQ_API_KEY** in the Web Service environment and redeploy.

- **Port**
  - Render sets **PORT** (usually 10000). The server uses `process.env.PORT`, so no change is needed in code.

- **Re-deploy**
  - Push to the connected branch; Render will rebuild and redeploy automatically. Or use **Manual Deploy** in the Dashboard.
