# Deploying Job Copilot to Vercel

The app deploys as **two Vercel projects** — the Next.js frontend and the FastAPI
backend (Python serverless functions) — backed by a **free Neon Postgres** database
(SQLite can't be used on Vercel because serverless has no persistent disk).

> Prereqs: Vercel CLI installed (`npm i -g vercel`) and logged in (`vercel login`).
> This repo already has the config: `backend/vercel.json`, `backend/api/index.py`,
> Postgres support, and CORS for `*.vercel.app`.

---

## 1. Create a free Neon Postgres database

Either:
- **Vercel dashboard** → your project → **Storage** → **Create Database** → **Neon** (Postgres), or
- **https://neon.tech** → new project → copy the connection string.

Copy the **pooled** connection string (host contains `-pooler`), e.g.:

```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

*(The code auto-converts `postgresql://` to the psycopg driver — paste it as-is.)*

## 2. Deploy the backend (FastAPI)

```bash
cd backend
vercel link --yes                        # create/link the backend project
vercel env add GROQ_API_KEY production   # paste your gsk_... key
vercel env add DATABASE_URL production   # paste the Neon pooled URL
openssl rand -hex 32 | vercel env add JWT_SECRET production  # login-token secret
vercel --prod
```

Note the deployed URL, e.g. `https://job-copilot-api.vercel.app`.
Verify: open `https://<backend-url>/api/health` → `{"status":"ok","groq_configured":true,...}`.

## 3. Deploy the frontend (Next.js)

`NEXT_PUBLIC_API_BASE` is inlined at build time, so set it **before** deploying:

```bash
cd ../frontend
vercel link --yes
vercel env add NEXT_PUBLIC_API_BASE production   # paste the backend URL from step 2
vercel --prod
```

Open the frontend URL — the home status is silent when healthy; go to **Profile →
Save**, then **Resume → Generate** to confirm the backend + DB work end-to-end.

---

## Environment variables summary

| Project  | Variable               | Value                                        |
| -------- | ---------------------- | -------------------------------------------- |
| backend  | `GROQ_API_KEY`         | your Groq key (`gsk_...`)                     |
| backend  | `DATABASE_URL`         | Neon pooled Postgres URL                      |
| backend  | `JWT_SECRET`           | strong random secret (`openssl rand -hex 32`)|
| backend  | `GROQ_MODEL` (optional)| defaults to `llama-3.3-70b-versatile`         |
| backend  | `RATE_LIMIT_PER_MIN` (optional) | LLM requests/user/minute (default 8)|
| backend  | `RATE_LIMIT_PER_DAY` (optional) | LLM requests/user/day (default 60)  |
| frontend | `NEXT_PUBLIC_API_BASE` | the backend's deployed URL                    |

## Accounts (multi-user)

The app uses email + password accounts. Every visitor must sign in or create an
account, and each account's profile, saved resumes, and question bank are fully
isolated. Set a strong `JWT_SECRET` in production so login tokens can't be forged:

```bash
cd backend
openssl rand -hex 32 | vercel env add JWT_SECRET production
vercel --prod --yes
```

Locally, a dev default secret is used if `JWT_SECRET` is unset, so `uvicorn` just
works. Registration is open to anyone, so the API is exposed to whoever has the
URL. A few things to plan for before wide release:

- **Shared LLM quota** — all resume generation uses your one `GROQ_API_KEY`, so
  Groq's free-tier rate limit is shared across every user. High traffic will
  throttle; add a paid LLM plan or per-user limits before scaling.
- **No rate limiting / email verification / password reset** yet — reasonable
  next steps for a public launch.

## One-off schema reset (after a model change)

Adding columns to existing tables isn't automatic (`create_all` only creates
missing tables). If you change the models and there's no data worth keeping,
reset the DB once via a temporary guarded endpoint:

1. Add `admin_reset_db` to `app/main.py` (guarded by an `ADMIN_RESET_KEY` env var
   that calls `reset_db()`), set the key, and deploy.
2. `curl -X POST "https://<backend>/api/admin/reset-db?key=<ADMIN_RESET_KEY>"`.
3. Remove the endpoint and the env var, then redeploy.

(A module-level `RESET_DB_ON_BOOT` flag is unreliable on Vercel — the guarded
endpoint always runs because it's a request handler.)

## Notes & troubleshooting

- **CORS** already allows any `*.vercel.app` origin, so the frontend can call the
  backend with no extra config. To lock it down, set `CORS_ORIGINS` on the backend
  to your exact frontend URL.
- **Cold starts**: the first request after idle provisions the DB schema
  (idempotent). Each user's question bank is seeded when they register.
- **Re-deploy after code changes**: `vercel --prod` in the respective folder.
- **Preview deploys**: omit `--prod` for a preview URL. Add the same env vars to the
  `preview` environment if you want previews to work (`vercel env add NAME preview`).
- Local dev is unchanged — it still uses SQLite; none of the above affects it.
