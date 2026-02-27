# NazarIQ — Civic Hazard Intelligence

NazarIQ is a React + Vite dashboard that blends live citizen hazard reports with municipal analytics. The UI powers the public landing dashboard, incident map, analytics panels, and admin tooling. This repository now ships with a lightweight Express + MongoDB API so incidents can stream directly from `civic_hazard_db.india_incidents` without relying on mock data.

## Tech Stack

- React 18 + TypeScript (Vite)
- shadcn/ui + Tailwind CSS
- TanStack Query for API state
- Express + MongoDB Node driver for the incidents API
- Google Maps (via @vis.gl/react-google-maps) for the live map

## Requirements

- Node.js 20+
- npm 10+
- MongoDB Atlas (or any MongoDB deployment) seeded with an `india_incidents` collection
- Google Maps API key (already referenced via `VITE_GOOGLE_MAPS_API_KEY`)

## Environment Variables

Copy `.env.example` to `.env` and fill in the secrets:

| Variable                       | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| `VITE_GOOGLE_MAPS_API_KEY`     | Client-side Maps key.                                                     |
| `VITE_API_BASE_URL`            | Frontend base path. Use `http://localhost:4000/api` when running locally. |
| `MONGODB_URI`                  | Full Mongo connection string (includes credentials).                      |
| `API_PORT`                     | Port for the Express API (defaults to `4000`).                            |
| `MONGODB_DB`                   | Optional override for the database name (default `civic_hazard_db`).      |
| `MONGODB_INCIDENTS_COLLECTION` | Optional override for the collection (default `india_incidents`).         |

> The `.env` file is gitignored, so keep a personal copy for local dev.

## Development Workflow

1. `npm install`
2. Populate `.env` with your Mongo connection string and API base URL (see above).
3. Start the incidents API server:
   ```bash
   npm run api
   ```
4. In a second terminal, start the Vite dev server:
   ```bash
   npm run dev
   ```
5. Navigate to `http://localhost:5173` for the frontend. All incident data, map markers, and analytics will read from Mongo through the Express API.

## API Server (`server/index.ts`)

- `/api/incidents` — returns normalized incidents with support for search, city, severity, status, hazard-type, and date-range filters (matching the frontend filter chips).
- `/api/incidents/:id` — fetch a single incident.
- `/api/incidents/:id` (PATCH) — update status, assignment, or admin notes with timeline enrichment.
- `/health` — simple readiness endpoint.

The server normalizes hazard types, severity, coordinates, and derived stats (risk score, confidence, timeline) so the frontend can continue using the same `Incident` TypeScript interface everywhere (map, cards, analytics, etc.).

## Available Scripts

| Command           | Purpose                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `npm run api`     | Start the Express + MongoDB API using `tsx`.                           |
| `npm run dev`     | Run the Vite dev server. Requires the API to be running for live data. |
| `npm run build`   | Production build of the frontend.                                      |
| `npm run lint`    | ESLint.                                                                |
| `npm run test`    | Vitest suite (jsdom).                                                  |
| `npm run preview` | Preview the production build.                                          |

## Testing

The dashboard currently ships with regression coverage for auth context, the AdminRoute guard, and baseline examples. Run `npm run test` after backend or UI changes.

## Deployment Notes

- The API server is standalone. Deploy it (and Mongo) anywhere, then point `VITE_API_BASE_URL` at the public base URL + `/api`.
- The frontend bundles are static and can be deployed to any CDN/hosting (Vercel, Netlify, Azure Static Web Apps, etc.).

## Next Steps

- Harden the API with authentication + rate limiting.
- Move analytics endpoints (`/trends`) off mock data using Mongo aggregation pipelines.
- Add WebSocket/Change Stream support for instant incident pushes to the dashboard.
