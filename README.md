# Job Copilot

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
pytest -q          # 23 tests: endpoints, CRUD, normalizer, extractor, retry/backoff
```

**Frontend** — unit tests for the pure logic (ATS scoring + one-page fit):

```bash
cd frontend
npm test           # Vitest: lib/ats.test.ts + lib/fit.test.ts
```

---

## Notes & troubleshooting

- **"Backend not reachable"** on the home page → start the FastAPI server on port 8000.
- **"set GROQ_API_KEY"** → add your key to `backend/.env` and restart the backend.
- **Cost** → Groq's free tier covers all calls; there are no other paid services.
- **PDF** uses the built-in Times font, so exports work even offline once installed.
- To change the model, set `GROQ_MODEL` in `backend/.env`.
