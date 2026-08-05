# Jupiter

Jupiter is an API-first, multi-tenant organizational ticketing MVP.

## Local development

This workspace requires Node.js 24+ and pnpm 11+. Install dependencies with:

```powershell
pnpm install
```

Run the API and web shell in separate terminals:

```powershell
pnpm dev:api
pnpm dev:web
```

The health endpoint is `http://localhost:3000/api/v1/health`. Run quality
checks with `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

Copy `.env.example` to `.env` only for local Docker Compose use. Do not
commit real values. Compose configures PostgreSQL, Redis, and MinIO; it does not
create the application schema.
