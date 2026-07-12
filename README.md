# RelatoriosESG — POC VSME B8

POC of a structured ESG report editor. A single `MiniQuestionnaire` block (VSME B8 — code of conduct / human rights checklist) is edited in the browser, persisted as JSONB in Postgres (Neon), and rendered as XHTML from the same JSON.

## Stack

- **Next.js 15** (App Router) — API routes + React UI in one project
- **Neon** — serverless Postgres
- **Vercel** — deployment

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

```bash
npm install
```

Create a `.env.local` file:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

Then:

```bash
npm run dev
# Runs on http://localhost:3000
```

## Deployment (Vercel)

1. Import the repo in Vercel
2. Add environment variable `DATABASE_URL` in the Vercel dashboard
3. Deploy — Vercel detects Next.js automatically

## API

| Method | Path                  | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/api/block/b8`       | Returns current B8 block (or empty)      |
| PUT    | `/api/block/b8`       | Validates with Zod and upserts to DB     |
| GET    | `/api/block/b8/xhtml` | Returns XHTML rendered from stored JSON  |

## Verifying the POC

```sql
SELECT content->'answers' FROM blocks WHERE questionnaire_code = 'B8';
```
