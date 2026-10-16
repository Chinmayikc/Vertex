# Vertex

Vertex technical club website — events, member directory, teams, and the internal
Smart India Hackathon (SIH) workspace.

Built with TanStack Start (React 19, Vite, Tailwind CSS v4) and Supabase
(Postgres, auth, storage). Deployed on Vercel.

## Development

### Requirements

- Node.js 20 or newer
- Docker Desktop
- Supabase CLI (`npm install supabase --save-dev`)

Vercel access is only needed to deploy the site. Local development uses the Supabase
stack on your machine, so you do not need access to the club's Vercel or hosted
Supabase projects.

### Start the local app

1. Install dependencies and start Supabase:

```bash
npm install
npx supabase start
```

The first `supabase start` downloads the local services and can take a few minutes.
It prints the local API URL and keys when the services are ready. You can also run
`npx supabase status -o env` to see them again. In another terminal, copy
`.env.example` to `.env` and set these values:

| `.env` variable | Supabase CLI value |
| --- | --- |
| `SUPABASE_URL` and `VITE_SUPABASE_URL` | `API_URL` |
| `SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY` | `ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` |
| `SUPABASE_PROJECT_ID` and `VITE_SUPABASE_PROJECT_ID` | Leave blank for local development |

These are the keys for your local Supabase instance. Keep `.env` private; never use a
production service-role key in a local checkout or commit `.env`.

2. Apply the migrations and start the app:

```bash
npx supabase db reset
npm run dev
```

Open the local URL printed by Vite (normally <http://localhost:3000>). The local
database starts empty; `supabase db reset` applies the repository migrations but
does not copy data from the hosted project. Authentication and database-backed
features use your local Supabase instance.

To stop the local Supabase services, run `npx supabase stop`.

## Database

Schema lives in `supabase/migrations/`. Apply to a project:

```bash
psql "$DATABASE_URL" -f supabase/migrations/<migration>.sql
```

## Deploy

Vercel picks up pushes to `main`. Required environment variables:

- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
