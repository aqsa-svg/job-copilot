# Job Copilot

**A resume tailor that reorders and rewrites what you actually did to match a job — and tells you what's missing instead of quietly inventing it.**

🔗 **Live API docs: [job-copilot-api.vercel.app/docs](https://job-copilot-api.vercel.app/docs)** — the FastAPI backend is deployed; the Next.js frontend runs locally (setup below).

<!-- SCREENSHOT: the tailor view — resume preview beside match score + gaps list.
     Replace with: ![Job Copilot tailor view](docs/screenshot-tailor.png) -->
> 📸 *Screenshot placeholder — tailored resume preview beside the match score, gaps list, and what-changed summary.*

Create and tailor **honest, ATS-friendly resumes** for **AI / ML / GenAI** roles —
plus application-answer help and an editable screening-question bank.

Runs **fully locally** with **no paid services**: FastAPI + SQLite on the backend,
Next.js + Tailwind + shadcn/ui on the frontend, and the **Groq free tier**
(`llama-3.3-70b-versatile`) for all LLM calls.

> **Honesty is enforced.** The app never fabricates experience, skills, employers,
> dates, or metrics. It only reorganizes, rephrases, and emphasizes what you
> entered. If a job needs something you don't have, it shows a separate
> **"gaps to address"** note instead of silently adding it. When a bullet has no
> known metric, it inserts a literal `[add metric]` placeholder rather than a made-up
> number.

---

## Features

**Resume builder (primary)**
- **Profile intake** — enter your details once, or **paste an existing resume** and have the LLM parse it into structured fields for review.
- **Generate** — turn your profile into structured resume JSON, rendered on a clean, print-quality page.
- **Tailor to a job** — paste a job description; the resume is reordered and rephrased to match the role (truthfully), with an **estimated match score**, a **gaps** list, and a **what-changed** summary.
- **Inline edit** — tweak the generated/tailored resume directly (text, bullets with AI-improve, reorder sections) before exporting.
- **Save & reopen versions** — keep base and tailored resumes in a **library** (rename, update, delete); the working resume also survives a page refresh (localStorage).
- **Improve bullets** — rewrite any bullet to be action-first and results-oriented, with `[add metric]` placeholders instead of invented numbers.
- **Two templates** — **Classic** (serif, centered header) and **Modern** (sans-serif, left-aligned); switch instantly, applies to both preview and PDF. Both stay single-column and ATS-safe.
- **One-page or multi-page** — a toggle; one-page mode scales font/spacing density to fit a single A4 **without cutting or rewriting any content** (the preview and PDF scale identically).
- **ATS score** — a transparent, **rule-based** ATS-friendliness score (0–100) with a full breakdown of *why* — contact completeness, standard sections, action-verb bullets, quantified impact, unfilled `[add metric]` placeholders, bullet length, machine-readable format, and (when tailored) JD keyword coverage. No LLM, nothing leaves your machine.
- **Import a file** — drag-and-drop a **PDF / DOCX / TXT**; the server extracts the text (`pypdf` / `python-docx`) and parses it into fields.
- **Export** — download a genuine **PDF** (`@react-pdf/renderer`, no system deps) and **Markdown**, or print.

**Secondary**
- **Application answers** — a ready-to-send "why I'm interested" + 4–6 likely screening questions answered in your voice.
- **Question bank** — seeded, editable AI/ML screening questions, each with a framing tip and sample answer.

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18.18+** (Node 20+ recommended)
- A free **Groq API key** → https://console.groq.com/keys
- Internet access for the first install/build (npm packages + the Inter web font).

---

## Setup

### 1) Backend (FastAPI)

```bash
cd backend

# create & activate a virtual environment
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# configure your key
cp .env.example .env        # Windows: copy .env.example .env
# then edit .env and set GROQ_API_KEY=...

# run the API (http://localhost:8000, docs at /docs)
uvicorn app.main:app --reload --port 8000
```

The SQLite database (`backend/jobcopilot.db`) and the seeded question bank are
created automatically on first launch.

### 2) Frontend (Next.js)

In a **second terminal**:

```bash
cd frontend
npm install

cp .env.local.example .env.local   # Windows: copy .env.local.example .env.local
# NEXT_PUBLIC_API_BASE defaults to http://localhost:8000 — fine for local dev

npm run dev
```

Open **http://localhost:3000**.

---

## How to use it

1. **Profile** → fill in your details (or *Paste existing resume* to auto-fill), then **Save profile**.
2. **Resume** → **Generate** a base resume, or open **Tailor**, paste a job description, and tailor it. Review the **gaps** it surfaces.
3. Use the ✨ button on any bullet to **improve** it. Export as **PDF** or **Markdown**.
4. **Apply** → paste a JD to get an honest "why I'm interested" + screening answers.
5. **Questions** → browse, edit, and add screening questions.

---

## Project structure

```
.
├── backend/                 FastAPI + SQLModel(SQLite) + Groq
│   ├── app/
│   │   ├── main.py          app + CORS + startup (create tables, seed)
│   │   ├── config.py        env-based settings
│   │   ├── database.py      SQLite engine / session
│   │   ├── models.py        Profile (JSON columns) + Question
│   │   ├── schemas.py       Pydantic request/response models
│   │   ├── crud.py          get-or-create profile helpers
│   │   ├── llm.py           Groq JSON-mode client wrapper
│   │   ├── prompts.py       honesty-enforced prompt templates
│   │   ├── seed.py          seeded AI/ML screening questions
│   │   └── routers/         profile, resume, apply, questions
│   ├── requirements.txt
│   └── .env.example
└── frontend/                Next.js (App Router) + Tailwind + shadcn/ui
    ├── app/                 home, profile, resume, apply, questions
    ├── components/          UI primitives + feature components
    ├── lib/                 api client, types, markdown export
    └── .env.local.example
```

## API overview

| Method | Path                        | Purpose                                  |
| ------ | --------------------------- | ---------------------------------------- |
| GET    | `/api/health`               | status + whether `GROQ_API_KEY` is set   |
| GET/PUT| `/api/profile`              | read / upsert the profile                |
| POST   | `/api/profile/parse`        | parse pasted resume text → fields        |
| POST   | `/api/resume/generate`      | profile → resume JSON (normalized)        |
| POST   | `/api/resume/tailor`        | JD → tailored resume + match score + gaps |
| POST   | `/api/resume/improve-bullet`| rewrite one bullet honestly              |
| CRUD   | `/api/resumes`              | save / list / open / rename / delete versions |
| POST   | `/api/apply/answers`        | "why interested" + screening Q&A         |
| CRUD   | `/api/questions`            | list / add / edit / delete questions     |

All LLM resume output is passed through a **normalizer** so the frontend/PDF/Markdown
layers always receive a strict, consistent shape (it only coerces/drops malformed
fields — it never invents content).

Groq calls use a small **retry/backoff** wrapper (3 attempts, exponential backoff) that
retries transient errors (rate limits, timeouts, 5xx) and fails fast on auth errors.

## Tests

**Backend** — throwaway SQLite DB + **mocked LLM** (no Groq calls, no key needed):

```bash
cd backend
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
pytest -q          # 37 tests: endpoints, auth, CRUD, normalizer, extractor, retry/backoff
```

**Frontend** — unit tests for the pure logic (ATS scoring + one-page fit):

```bash
cd frontend
npm test           # 11 tests: lib/ats.test.ts (6) + lib/fit.test.ts (5)
```

### Measured

Run in clean environments — Python 3.11.0 venv and a fresh `npm install` — on 2026-09-02.

| Measured | Value |
|---|---|
| Backend suite | **37 passing**, 6 files, 22.1s, no Groq key needed (LLM mocked) |
| — `test_api.py` | 9 · endpoints and CRUD |
| — `test_extract.py` | 9 · PDF/DOCX/TXT extraction |
| — `test_auth.py` | 7 · JWT issue/verify |
| — `test_ratelimit.py` | 5 · rate limiter |
| — `test_normalize.py` | 4 · resume normalizer |
| — `test_llm.py` | 3 · retry/backoff wrapper |
| Frontend suite | **11 passing**, 2 files, 0.9s |
| **Total** | **48 tests**, all passing, zero API keys required |
| Source | 89 files — FastAPI backend + Next.js frontend |
| Deployed API | `job-copilot-api.vercel.app/docs` → HTTP 200 |

The entire suite runs without a Groq key: the LLM is mocked and the tests use a throwaway SQLite DB.

**[TODO] ATS score validation.** The rule-based 0–100 score is the most checkable claim in the app and is currently unvalidated. *To measure:* run 20 resumes of known quality through it and report whether the ranking matches human judgement, plus the score distribution.

**[TODO] Tailoring faithfulness.** The honesty guarantee is enforced by prompt plus a normalizer, not by a hard gate like the one in [attune](https://github.com/aqsa-svg/attune). *To measure:* run N=100 tailor operations against varied job descriptions and count how often the output introduces a skill, employer, date, or metric absent from the input profile. That number is the product's core claim.

---

## Architecture

```
  Profile intake  ---or---  paste/upload an existing resume (PDF/DOCX/TXT)
        |                              |
        |                              v
        |                    app/extract.py  (pypdf / python-docx)
        |                              |
        +--------------+---------------+
                       v
              app/normalize.py   structured profile fields
                       |
                       v
        +--------------------------------------------+
        |  app/prompts.py + app/llm.py               |
        |  Groq  llama-3.3-70b-versatile             |
        |  retry/backoff: 3 attempts, exponential;   |
        |  fails fast on auth errors                 |
        |  The prompt may ONLY reorder, rephrase,    |
        |  and emphasise the fields above.           |
        +----------------------+---------------------+
                               |
                               v
                    resume JSON  +  gaps[]  +  match score
                               |
        +----------------------+----------------------+
        |                                             |
        v                                             v
  lib/ats.ts  rule-based ATS score 0-100        @react-pdf/renderer
  no LLM, nothing leaves the machine            PDF / Markdown export
  contact, sections, action verbs,                     |
  quantified impact, [add metric]                      v
  placeholders, bullet length,               lib/fit.ts  one-page density
  JD keyword coverage                        scaling (no content cut)

  Persistence: SQLite via SQLAlchemy | Auth: JWT (HS256) | Rate limiting: app/ratelimit.py
```

## Known limitations

- **The frontend has 9 npm vulnerabilities, 2 critical.** `next@14.2.21` is affected by SSRF via improper middleware redirect handling, cache-key confusion and content injection in the Image Optimization API, and dev-server information exposure. `vitest` is the other critical (arbitrary file read when the UI server listens) but is dev-only, as are the `vite`/`esbuild`/`postcss`/`browserslist` findings. **Upgrading Next.js is the single most important fix in this repo.** Run `npm audit` to reproduce.
- **Honesty is enforced by prompt and normalizer, not by a hard gate.** The instruction not to fabricate is in the prompt and the output is normalized against known fields, but there is no pure, unit-tested function with veto power the way there is in `attune`. Fabrication is discouraged structurally, not made unreachable — and the rate at which it still happens is unmeasured.
- **`JWT_SECRET` has a known default.** `config.py` falls back to `dev-insecure-change-me` and documents that production must override it, but nothing fails fast if it doesn't. Any deployment that skips it has forgeable tokens.
- **The ATS score is a heuristic, not a real ATS.** It is transparent and rule-based by design, but it models what ATS parsers generally reward — it does not replicate any specific vendor's system.
- **The deployed backend is API-only.** `job-copilot-api.vercel.app` serves `/docs`; the root path returns 404 and the frontend is not deployed.
- **SQLite by default.** Fine locally; a serverless deployment needs `DATABASE_URL` pointed at a real Postgres, since Vercel's filesystem is ephemeral.
- **Groq free tier applies.** Rate limits are real, which is why the retry/backoff wrapper exists; heavy use will still hit them.
- **Match score is LLM-produced**, so it is an estimate, not a measurement — unlike the ATS score beside it, which is deterministic.

---

## Notes & troubleshooting

- **"Backend not reachable"** on the home page → start the FastAPI server on port 8000.
- **"set GROQ_API_KEY"** → add your key to `backend/.env` and restart the backend.
- **Cost** → Groq's free tier covers all calls; there are no other paid services.
- **PDF** uses the built-in Times font, so exports work even offline once installed.
- To change the model, set `GROQ_MODEL` in `backend/.env`.
