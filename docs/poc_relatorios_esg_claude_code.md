# POC — Editor de bloco estruturado (VSME B8) com persistência em Postgres

## Objetivo

Provar o fluxo central da arquitetura de relatórios ESG: um bloco de conteúdo tipado
(schema Pydantic) é editado no ecrã, persistido como JSON estruturado numa coluna
JSONB do Postgres, e re-renderizado a partir desse JSON — sem passar por um blob de
texto/HTML como fonte de verdade.

Esta POC cobre um único exemplo de bloco: o `MiniQuestionnaire`, instanciado com o
checklist do disclosure B8 do VSME (código de conduta / direitos humanos).

Fora de âmbito nesta POC:
- Autenticação ou gestão de utilizadores
- Geração de documentos (PDF, iXBRL)
- Motor de pesquisa
- Regras de condicionalidade/threshold (ex. "voluntary for undertakings with 10
  employees or less") — o checklist é apresentado sem esta lógica
- Tabela `questionnaire_item_definitions` — a definição dos itens do B8 fica
  hardcoded no backend
- Outros tipos de bloco (métrica, narrativa, série temporal, tabela) — só
  `MiniQuestionnaire`

## Conteúdo do exemplo (disclosure B8 do VSME)

Checklist a implementar, com os seguintes itens:

- `code_of_conduct` — "Does the undertaking have a code of conduct or human rights
  policy for its own workforce?" (YES/NO, sem specify)
- `covers_child_labour` — "Does this cover child labour?" (YES/NO, sem specify)
- `covers_forced_labour` — "Does this cover forced labour?" (YES/NO, sem specify)
- `covers_human_trafficking` — "Does this cover human trafficking?" (YES/NO, sem
  specify)
- `covers_discrimination` — "Does this cover discrimination?" (YES/NO, sem specify)
- `covers_accident_prevention` — "Does this cover accident prevention?" (YES/NO,
  sem specify)
- `covers_other` — "Does this cover other?" (YES/NO, com specify condicional —
  campo de texto livre visível/obrigatório apenas se value = YES)
- `complaints_mechanism` — "Does the undertaking have a complaints-handling
  mechanism for its own workforce?" (YES/NO, sem specify)

## Modelo de dados

**Backend (Pydantic):**
- `ChecklistAnswer`: `item_code: str`, `value: Literal["YES", "NO"] | None`,
  `specify: str | None`
- `MiniQuestionnaire`: `questionnaire_code: str` (= `"B8"` nesta POC),
  `answers: list[ChecklistAnswer]`

A definição estática dos itens do B8 (código, label, `allows_specify: bool`) fica
hardcoded numa constante Python no backend, não em base de dados.

**Base de dados (Postgres via Neon):**
Uma única tabela, simples:

```sql
CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    block_type TEXT NOT NULL DEFAULT 'mini_questionnaire',
    questionnaire_code TEXT NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`content` guarda o `MiniQuestionnaire` serializado (`.model_dump()`), ex.:

```json
{
  "questionnaire_code": "B8",
  "answers": [
    {"item_code": "code_of_conduct", "value": "YES", "specify": null},
    {"item_code": "covers_other", "value": "YES", "specify": "Data privacy"}
  ]
}
```

Para a POC basta um único registo (id fixo ou o mais recente) — não é necessário
suportar múltiplos relatórios/versões.

## API (Flask)

- `GET /api/block/b8` — devolve o registo atual (JSON estruturado). Se não existir
  ainda em BD, devolve a estrutura vazia com todos os `item_code` do B8 e
  `value: null`.
- `PUT /api/block/b8` — recebe o `MiniQuestionnaire` completo (JSON), valida com
  Pydantic, faz upsert na tabela `blocks`.
- `GET /api/block/b8/xhtml` — devolve o mesmo conteúdo renderizado como XHTML
  (gerado a partir do JSON em memória, não guardado à parte).

Sem autenticação. CORS aberto para o frontend local/Vercel.

## Frontend (React)

Uma única página:
- Formulário com os 8 itens do checklist, cada um com toggle/radio YES/NO.
  `covers_other`: campo de texto "specify" que só aparece/é editável quando o
  valor é YES.
- Botão "Guardar" → `PUT /api/block/b8`.
- Ao carregar a página → `GET /api/block/b8` para popular o formulário com o
  estado atual.
- Uma área secundária (ex. abaixo do formulário ou num toggle "Ver XHTML") que
  mostra o resultado de `GET /api/block/b8/xhtml`, para demonstrar visualmente
  que o mesmo JSON gera a representação XHTML.

Sem componentes de UI library específicos — pode ser React simples com CSS
mínimo, o foco é o fluxo de dados, não o design.

## Geração de XHTML

Função no backend que recebe um `MiniQuestionnaire` e devolve uma string XHTML
simples: uma lista ou tabela com label de cada item + valor (YES/NO) + specify
quando aplicável. Não precisa de seguir a norma iXBRL/ESEF nesta POC — só
demonstrar que o JSON é a fonte e o XHTML é derivado.

## Estrutura do repositório

Monorepo:

```
/backend
  app.py              # Flask app, rotas
  models.py           # Pydantic: ChecklistAnswer, MiniQuestionnaire
  b8_definition.py     # constante com os 8 itens hardcoded
  db.py               # ligação Postgres (Neon), upsert/select
  xhtml.py            # função de renderização JSON -> XHTML
  requirements.txt
  vercel.json         # config serverless
/frontend
  (projeto React standard: create-vite ou equivalente)
  src/App.jsx
  package.json
README.md             # como correr localmente + como fazer deploy
```

## Deployment

- **Base de dados**: Neon (Postgres serverless). Connection string em variável
  de ambiente `DATABASE_URL`, lida pelo backend.
- **Backend**: Flask adaptado a função serverless, deploy no Vercel via GitHub
  (mesmo repositório, pasta `/backend`).
- **Frontend**: React, deploy no Vercel via GitHub (pasta `/frontend`), nativo,
  sem adaptação.
- Variáveis de ambiente (`DATABASE_URL`, URL da API para o frontend) configuradas
  no dashboard do Vercel, não commitadas.

## Critério de sucesso da POC

1. Abrir a app no browser, preencher o checklist B8, guardar.
2. Reload da página → os valores guardados aparecem corretamente carregados.
3. Ver o XHTML gerado a partir do mesmo registo, refletindo os valores guardados.
4. Confirmar em Neon (via SQL) que o `content` na tabela `blocks` é JSON
   estruturado e interrogável (ex. `SELECT content->'answers' FROM blocks`),
   não uma string de HTML.
