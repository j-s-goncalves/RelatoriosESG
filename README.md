# RelatoriosESG — POC VSME B8

POC of a structured ESG report editor. A single `MiniQuestionnaire` block (VSME B8 — code of conduct / human rights checklist) is edited in the browser, persisted as JSONB in Postgres (Neon), and rendered as XHTML from the same JSON.

## Prerequisites

- Python 3.11+
- Node.js 18+
- A [Neon](https://neon.tech) Postgres database

## Database setup

Run this in your Neon SQL editor:

```sql
CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    block_type TEXT NOT NULL DEFAULT 'mini_questionnaire',
    questionnaire_code TEXT NOT NULL UNIQUE,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Running locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
python app.py
# Runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`.

## Deployment (Vercel)

### Backend

1. Import the repo in Vercel, set **Root Directory** to `backend`.
2. Add environment variable `DATABASE_URL` in the Vercel dashboard.
3. Vercel uses `vercel.json` to route `/api/*` to `app.py`.

### Frontend

1. Add a second Vercel project, set **Root Directory** to `frontend`.
2. Add environment variable `VITE_API_URL` pointing to the backend Vercel URL (e.g. `https://your-backend.vercel.app`).
3. Deploy — Vercel detects Vite automatically.

## API

| Method | Path                  | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/api/block/b8`       | Returns current B8 block (or empty)      |
| PUT    | `/api/block/b8`       | Validates and upserts B8 block           |
| GET    | `/api/block/b8/xhtml` | Returns XHTML rendered from stored JSON  |

## Verifying the POC

```sql
-- Confirm content is structured JSONB, not HTML
SELECT content->'answers' FROM blocks WHERE questionnaire_code = 'B8';
```
