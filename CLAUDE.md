# RelatoriosESG — POC VSME B8

## What this is
A proof-of-concept for a structured ESG report editor. The core idea: content blocks are
typed Pydantic schemas, persisted as JSONB in Postgres, and rendered from that JSON — never
from an HTML blob.

This POC covers a single block type: `MiniQuestionnaire`, instantiated with the VSME B8
disclosure checklist (code of conduct / human rights).

## Stack
- **Backend:** Flask + Pydantic + psycopg2, deployed as Vercel serverless function
- **Frontend:** React (Vite), no UI library, deployed on Vercel
- **Database:** Neon (serverless Postgres), connection via `DATABASE_URL` env var

## Repo structure (monorepo)
```
/backend
  app.py            # Flask app + routes
  models.py         # Pydantic: ChecklistAnswer, MiniQuestionnaire
  b8_definition.py  # Hardcoded list of 8 B8 checklist items
  db.py             # Neon connection, upsert/select
  xhtml.py          # JSON -> XHTML renderer
  requirements.txt
  vercel.json
/frontend
  src/App.jsx
  package.json
  vite.config.js
CLAUDE.md
README.md
```

## Database schema
```sql
CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    block_type TEXT NOT NULL DEFAULT 'mini_questionnaire',
    questionnaire_code TEXT NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
Single row for the POC (upsert by questionnaire_code = 'B8').

## API
- `GET  /api/block/b8`       — returns current block (empty structure if none exists)
- `PUT  /api/block/b8`       — validates with Pydantic, upserts to DB
- `GET  /api/block/b8/xhtml` — returns XHTML rendered from the stored JSON

No auth. CORS open for localhost + Vercel frontend.

## B8 checklist items (hardcoded)
| item_code                | allows_specify |
|--------------------------|----------------|
| code_of_conduct          | false          |
| covers_child_labour      | false          |
| covers_forced_labour     | false          |
| covers_human_trafficking | false          |
| covers_discrimination    | false          |
| covers_accident_prevention | false        |
| covers_other             | true           |
| complaints_mechanism     | false          |

`covers_other` shows a free-text "specify" field only when value = YES.

## Out of scope for this POC
- Auth / user management
- PDF / iXBRL generation
- Search engine
- Conditionality rules (employee thresholds)
- `questionnaire_item_definitions` table (items are hardcoded)
- Other block types (metric, narrative, time series, table)

## Success criteria
1. Fill checklist in browser → save
2. Reload → values restored
3. XHTML view reflects saved values
4. Neon SQL confirms `content` is queryable JSONB, not HTML
