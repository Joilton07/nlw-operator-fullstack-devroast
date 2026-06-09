# Drizzle ORM — Especificação de Implementação

## Stack

| Camada | Tecnologia |
|--------|-----------|
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Driver | `drizzle-orm` + `drizzle-kit` + `pg` |
| Banco | PostgreSQL 16 (via Docker Compose) |
| Migração | `drizzle-kit push` (dev) / `drizzle-kit migrate` (prod) |
| Schema | `src/db/schema/` — arquivos por domínio |

---

## Docker Compose

Criar `docker-compose.yml` na raiz:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: devroast-pg
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
      POSTGRES_DB: devroast
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Comandos:**

```bash
docker compose up -d         # sobe o Postgres
docker compose down          # derruba
```

---

## Packages

```bash
npm i drizzle-orm pg
npm i -D drizzle-kit
```

---

## Configuração

### `src/db/index.ts`

```ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'devroast',
  password: process.env.DB_PASSWORD ?? 'devroast',
  database: process.env.DB_NAME ?? 'devroast',
});

export const db = drizzle(pool, { schema });
```

### `drizzle.config.ts` (raiz)

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://devroast:devroast@localhost:5432/devroast',
  },
});
```

### Scripts (adicione no `package.json`)

```json
"scripts": {
  "db:generate": "drizzle-kit generate",
  "db:push": "drizzle-kit push",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

---

## Schema — Tabelas

### `submissions` — código submetido pelo usuário

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `serial` PK | ID único |
| `code_content` | `text` not null | Código-fonte submetido |
| `language` | `varchar(32)` | Linguagem detectada (ex: `javascript`, `python`) |
| `score` | `numeric(3,1)` | Nota 0.0–10.0 |
| `roast_quote` | `text` | Roast gerado (ex: *"this code looks like it was written during a power outage..."*) |
| `roast_mode` | `roast_mode` not null | Modo escolhido: `honest` ou `sarcasm` |
| `verdict` | `verdict` | Classificação final |
| `created_at` | `timestamptz` default now() | Data de criação |

### `analysis_issues` — problemas encontrados na análise

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `serial` PK | ID único |
| `submission_id` | `integer` FK → `submissions.id` on delete cascade | Submissão vinculada |
| `severity` | `issue_severity` not null | `critical`, `warning` ou `good` |
| `title` | `varchar(255)` not null | Título do problema (ex: *"using var instead of const/let"*) |
| `description` | `text` | Explicação detalhada |
| `line_start` | `integer` | Linha inicial no código |
| `line_end` | `integer` | Linha final |
| `created_at` | `timestamptz` default now() | Data de criação |

### `suggested_fixes` — sugestões de correção (diff lines)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `serial` PK | ID único |
| `issue_id` | `integer` FK → `analysis_issues.id` on delete cascade | Issue vinculada |
| `diff_type` | `diff_type` not null | `removed`, `added` ou `context` |
| `code_content` | `text` not null | Linha de código (ex: `- var total = 0;`) |
| `line_number` | `integer` | Número da linha no diff |
| `sort_order` | `integer` not null default 0 | Ordem de exibição |

---

## Enums

```sql
-- Modo de roast
CREATE TYPE roast_mode AS ENUM ('honest', 'sarcasm');

-- Verdict final da submissão
CREATE TYPE verdict AS ENUM ('critical', 'warning', 'good', 'needs_serious_help');

-- Severidade do issue de análise
CREATE TYPE issue_severity AS ENUM ('critical', 'warning', 'good');

-- Tipo de linha no diff
CREATE TYPE diff_type AS ENUM ('removed', 'added', 'context');
```

No Drizzle, usar `pgEnum()`:

```ts
import { pgEnum } from 'drizzle-orm/pg-core';

export const roastMode = pgEnum('roast_mode', ['honest', 'sarcasm']);
export const verdictEnum = pgEnum('verdict', ['critical', 'warning', 'good', 'needs_serious_help']);
export const issueSeverity = pgEnum('issue_severity', ['critical', 'warning', 'good']);
export const diffType = pgEnum('diff_type', ['removed', 'added', 'context']);
```

---

## Mapeamento Design → Schema

| Tela do Pencil | Tabela(s) envolvida(s) |
|----------------|------------------------|
| Screen 1 — Stats (`2,847 codes roasted` / `avg score: 4.2/10`) | `submissions` (COUNT, AVG) |
| Screen 1 — Leaderboard Preview (top 3) | `submissions` (ORDER BY score LIMIT 3) |
| Screen 2 — Score Ring, Verdict, Roast Quote | `submissions` (score, verdict, roast_quote) |
| Screen 2 — Analysis Issues Grid | `analysis_issues` (join submission_id) |
| Screen 2 — Diff / Suggested Fix | `suggested_fixes` (join issue_id) |
| Screen 3 — Full Leaderboard | `submissions` (ORDER BY score) |

---

## To-Do List

### Setup

- [ ] `npm i drizzle-orm pg && npm i -D drizzle-kit`
- [ ] Criar `docker-compose.yml` na raiz
- [ ] Criar `drizzle.config.ts` na raiz
- [ ] Criar `src/db/index.ts` com conexão
- [ ] Criar `src/db/schema/index.ts` (central — re-exporta todos os schemas)
- [ ] Adicionar scripts `db:generate`, `db:push`, `db:migrate`, `db:studio` no `package.json`
- [ ] Adicionar `.env` e `.env.example` com `DATABASE_URL`

### Schema

- [ ] `src/db/schema/enums.ts` — `pgEnum` definitions
- [ ] `src/db/schema/submissions.ts` — tabela `submissions`
- [ ] `src/db/schema/analysis-issues.ts` — tabela `analysis_issues`
- [ ] `src/db/schema/suggested-fixes.ts` — tabela `suggested_fixes`
- [ ] Executar `npm run db:push` para criar as tabelas no Postgres local
- [ ] Verificar com `npm run db:studio`

### Seed (opcional)

- [ ] Criar `src/db/seed.ts` com dados de exemplo (3–5 submissões, issues, fixes)
- [ ] Adicionar script `db:seed` no `package.json`

### Integração com o App

- [ ] Criar `src/db/queries/submissions.ts` — funções de query (insertSubmission, getLeaderboard, getSubmissionById, etc.)
- [ ] Substituir dados estáticos do frontend pelos dados reais do banco
