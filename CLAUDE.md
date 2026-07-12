# RelatoriosESG — POC VSME B8

## What this is
A proof-of-concept for a structured ESG report editor. The core idea: content blocks are
typed schemas, persisted as JSONB in Postgres, and rendered from that JSON — never
from an HTML blob.

This POC covers a single block type: `MiniQuestionnaire`, instantiated with the VSME B8
disclosure checklist (code of conduct / human rights).

## Stack
- **Framework:** Next.js 15 (App Router) — API routes + React frontend in one project
- **Validation:** Zod
- **Database:** Neon (serverless Postgres), connection via `DATABASE_URL` env var, using `@neondatabase/serverless`
- **Deploy:** Vercel (single project)

## Repo structure
```
/
├── app/
│   ├── api/block/b8/
│   │   ├── route.js          # GET + PUT
│   │   └── xhtml/route.js    # GET XHTML
│   ├── layout.jsx
│   └── page.jsx              # React UI
├── lib/
│   ├── b8Definition.js       # Hardcoded B8 items + emptyB8()
│   ├── db.js                 # Neon getBlock / upsertBlock
│   └── xhtml.js              # JSON -> XHTML renderer
├── next.config.mjs
├── package.json
├── CLAUDE.md
└── README.md
```

## Database schema
```sql
CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    block_type TEXT NOT NULL DEFAULT 'mini_questionnaire',
    questionnaire_code TEXT NOT NULL UNIQUE,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## API
- `GET  /api/block/b8`       — returns current block (empty structure if none exists)
- `PUT  /api/block/b8`       — validates with Zod, upserts to DB
- `GET  /api/block/b8/xhtml` — returns XHTML rendered from the stored JSON

## B8 checklist items (hardcoded in lib/b8Definition.js)
| item_code                  | allows_specify |
|----------------------------|----------------|
| code_of_conduct            | false          |
| covers_child_labour        | false          |
| covers_forced_labour       | false          |
| covers_human_trafficking   | false          |
| covers_discrimination      | false          |
| covers_accident_prevention | false          |
| covers_other               | true           |
| complaints_mechanism       | false          |

## Out of scope for this POC
- Auth / user management
- PDF / iXBRL generation
- Search engine
- Conditionality rules
- Other block types (metric, narrative, time series, table)

## Success criteria
1. Fill checklist in browser → save
2. Reload → values restored
3. XHTML view reflects saved values
4. Neon SQL confirms `content` is queryable JSONB
