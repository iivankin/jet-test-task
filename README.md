# Jet Test Task

## Setup

Run `pnpm i`

Setup `.env`:

```sh
$ echo "DATABASE_URL=postgresql://jet-user:test@localhost:5432/jet-db?schema=public" > apps/api/.env
```

Run docker: `docker compose up -d`

Run migration: `pnpm migrate`

Run services: `pnpm dev`

Open http://localhost:5000

## Prod Build

Run `pnpm build`

Run `cd web && pnpm start`
