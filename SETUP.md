# NazarIQ — Setup & Project Structure Guide

> **AI-Powered Civic Hazard Intelligence Dashboard**
> "Watchful Intelligence for Every City"

---

## 🚀 Quick Start (Frontend + API)

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd nazariq

# Install dependencies
npm install

# Start the Mongo-backed API (terminal 1)
npm run api

# Start the Vite dev server (terminal 2)
npm run dev
```

The API listens on `http://localhost:4000` (configurable) and the Vite app runs at `http://localhost:8081` (see `vite.config.ts`) with hot reload.

## ✅ End-to-End Setup Checklist

1. **Clone & install** — `git clone`, `cd nazariq`, and `npm install` at the repo root.
2. **Copy env template** — `cp .env.example .env` (or duplicate manually on Windows).
3. **Update secrets** — paste your `MONGODB_URI`, `VITE_API_BASE_URL`, and `VITE_GOOGLE_MAPS_API_KEY`.
4. **Verify Mongo access** — run `mongosh "<MONGODB_URI>" --eval "db.serverStatus().ok"`; expect `1`.
5. **Seed/inspect data** — confirm the `civic_hazard_db.india_incidents` collection has recent docs (or import `data/mockIncidents.json`).
6. **Start the API** — `npm run api` and wait for `NazarIQ API server running`.
7. **Smoke test the API** — curl `http://localhost:4000/api/incidents?limit=5` or open `http://localhost:4000/health` in a browser.
8. **Start the frontend** — `npm run dev` in a second terminal; Vite opens on port `8081` per `vite.config.ts`.
9. **Point the client to the API** — ensure `VITE_API_BASE_URL` matches the API origin (default `http://localhost:4000/api`).
10. **Confirm maps** — verify the Google Maps layer renders; if not, check the API key restrictions.
11. **Run tests** — `npm run test` for vitest + React Testing Library smoke coverage.
12. **Document environment** — update `SETUP.md` / `README.md` if you change ports, env names, or secrets for the team.

### Required Environment Variables

1. Copy `.env.example` to `.env`.
2. Fill in:

- `MONGODB_URI` — cluster connection string (with credentials)
- `API_PORT` — optional (defaults to 4000)
- `VITE_API_BASE_URL` — typically `http://localhost:4000/api` in dev
- `VITE_GOOGLE_MAPS_API_KEY` — already present if maps were configured earlier
- (Optional) `VITE_PUBLIC_DEMO_EMAIL`, `VITE_PUBLIC_DEMO_PASS`, `VITE_ADMIN_DEMO_PASS` — override the default demo credentials surfaced on `/login` and `/signup`.

3. (Optional) Override `MONGODB_DB` or `MONGODB_INCIDENTS_COLLECTION` if your cluster uses different names.

Without `VITE_API_BASE_URL`, the frontend will fall back to mock incidents; ensure the var is set so every surface pulls from Mongo.

### Mongo Collection Contract

The API expects the `india_incidents` collection inside `civic_hazard_db` to expose fields such as `hazard_type`, `severity`, `status`, `coordinates`, `location_name`, `city`, `datetime`, `confidence`, etc. The Express layer normalizes these into the strongly typed `Incident` model used across Map, dashboard KPIs, analytics, and admin experiences.

### MongoDB Atlas Notes

- Add the machine’s IP (or `0.0.0.0/0` for testing) to the Atlas Network Access list.
- Keep the cluster in the same region as your edge functions/backend when possible to minimize latency for live map markers.
- The API reads **up to 1,200 docs** per trends request; keep at least that many recent incidents available to populate the 90-day analytics view.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, page-level layout components
│   ├── ui/              # shadcn/ui primitives (Button, Card, Table, etc.)
│   ├── shared/          # Reusable domain components
│   │   ├── StatCard.tsx          # KPI card with sparkline & count-up
│   │   ├── IncidentCard.tsx      # Incident feed card
│   │   ├── SeverityBadge.tsx     # CRITICAL/HIGH/MEDIUM/LOW badge
│   │   ├── StatusBadge.tsx       # DETECTED/ALERTED/IN_PROGRESS/RESOLVED
│   │   ├── HazardTypeBadge.tsx   # Hazard type with signature color
│   │   ├── SourceBadge.tsx       # Data source indicator
│   │   ├── RiskScoreBar.tsx      # Animated risk score bar
│   │   ├── GlassCard.tsx         # Glassmorphism container
│   │   └── EmptyState.tsx        # Empty/no-results state
│   ├── charts/          # Recharts-based visualizations
│   │   ├── HazardTrendChart.tsx  # Multi-line trend over 30 days
│   │   ├── HazardTypeDonut.tsx   # Donut chart by hazard type
│   │   ├── CityBarChart.tsx      # Horizontal bar chart by city
│   │   ├── SourceActivityChart.tsx
│   │   └── ResolutionGauge.tsx   # Radial gauge for resolution rate
│   └── map/
│       └── MapSimulation.tsx     # Custom SVG India map with markers
│
├── pages/
│   ├── PublicDashboard.tsx       # Main public-facing dashboard
│   ├── IncidentDetail.tsx        # Single incident deep-dive
│   ├── TrendsPage.tsx            # Analytics & trend charts
│   ├── LoginPage.tsx             # Auth with demo access
│   ├── NotFound.tsx
│   └── admin/
│       ├── AdminDashboard.tsx    # Operations center
│       └── IncidentManagement.tsx # Table-based incident CRUD
│
├── context/
│   ├── AuthContext.tsx           # RBAC: public vs admin roles
│   ├── ThemeContext.tsx          # 3-theme switcher (command/municipal/contrast)
│   └── FilterContext.tsx         # Global filter state + incident store
│
├── data/                # Mock data (still used for trends/sources)
│   ├── mockIncidents.ts          # 30 realistic incidents
│   ├── mockSources.ts            # 7 data source configs
│   ├── mockAdmins.ts             # Admin user profiles
│   ├── mockActivityLog.ts        # Audit trail entries
│   ├── mockAlerts.ts             # Sent alert records
│   └── mockTrendData.ts          # 30-day trend + city stats
│
├── hooks/
│   └── useCountUp.ts            # Animated counter hook
│
├── types/
│   └── index.ts                 # All TypeScript interfaces & types
│
├── lib/
│   ├── apiClient.ts            # Fetch helper honoring VITE_API_BASE_URL
│   ├── incidentsApi.ts         # Live incidents (uses API when configured)
│   ├── trendsApi.ts            # Trend analytics (mock for now)
│   ├── queryKeys.ts            # TanStack Query keys
│   ├── utils.ts                # Utility functions (cn, etc.)
│   └── constants.ts            # Colors, labels, city coordinates
│
├── App.tsx                      # Router + provider tree
├── main.tsx                     # Entry point
└── index.css                    # Tailwind + 3 theme definitions + animations
```

---

## 🎨 Design System & Theming

### Three Themes

| Theme     | Class              | Description                 |
| --------- | ------------------ | --------------------------- |
| Command   | `.theme-command`   | Dark ops-center (default)   |
| Municipal | `.theme-municipal` | Light government-friendly   |
| Contrast  | `.theme-contrast`  | High-contrast accessibility |

Themes use CSS custom properties in `src/index.css`. All components use semantic tokens (`--background`, `--foreground`, `--primary`, etc.) — never raw colors.

### Hazard Type Colors

Each of the 9 hazard types has a unique signature color defined in both `index.css` (as HSL vars) and `constants.ts` (as hex for Recharts):

| Type               | Color     |
| ------------------ | --------- |
| POTHOLE            | `#FF6B6B` |
| WATERLOGGING       | `#4ECDC4` |
| FALLEN_TREE        | `#45B7D1` |
| ROAD_COLLAPSE      | `#FF4757` |
| CONSTRUCTION_ZONE  | `#FFA502` |
| STRUCTURAL_FAILURE | `#A55EEA` |
| DEBRIS             | `#778CA3` |
| SEWAGE_OVERFLOW    | `#26DE81` |
| OTHER              | `#B0BEC5` |

---

## 🔌 Backend Integration Guide

The frontend is fully functional with mock data. To connect a real backend:

### Backend Reference Implementation (Mongo + Express)

The repository now ships with a minimal Express server (`server/index.ts`) that:

- Connects to the provided Mongo cluster via `MONGODB_URI`.
- Normalizes raw documents into the shared `Incident` TypeScript model.
- Supports search/date filters at the database layer and mirrors the frontend filter chips in memory (city, severity, status, hazard type).
- Exposes `GET /api/incidents`, `GET /api/incidents/:id`, `PATCH /api/incidents/:id`, and `GET /api/trends` for analytics.

### Backend Execution Steps

1. Duplicate `.env.example` → `.env` and set the Mongo + Google Maps keys.
2. Run `npm run api` to start the Express server on port `4000`.
3. Hit `GET /` to verify the welcome payload, then `GET /api/incidents` to ensure documents serialize correctly.
4. Use `PATCH /api/incidents/:id` (with a JSON body `{ "status": "IN_PROGRESS" }`) to confirm write permissions.
5. Hit `GET /api/trends?range=30D` and ensure the payload matches the chart contracts (`daily`, `sourceDaily`, `cityStats`, `predictions`).
6. Keep the API process running when launching the frontend so TanStack Query can hydrate with live data.

### Frontend Execution Steps

1. Ensure `VITE_API_BASE_URL` resolves to the running API (`http://localhost:4000/api`).
2. Run `npm run dev` and open `http://localhost:8081`.
3. Visit `/trends` to confirm the hazard trend, donut, city bar, and source charts render live data instead of mock values.
4. On the public dashboard, use the City filter to select a single city and verify the Google Map auto-zooms to that area.
5. Open `/admin` (or `/login` → admin) to check that the operations center shows the same live incidents and map state.
6. Run `npm run build` when you need a production bundle that consumes the same API origin.

> You can still migrate to Supabase/Postgres later; replace the Express layer when ready.

---

## 🧩 Adding New Features

### Adding a New Hazard Type

1. Add to `src/types/index.ts` → `HazardType` union
2. Add color to `src/lib/constants.ts` → `HAZARD_COLORS`
3. Add label to `src/lib/constants.ts` → `HAZARD_LABELS`
4. Add CSS var to `src/index.css` → `:root` block
5. Add base count in `src/data/mockTrendData.ts`
6. Update DB constraint if using backend

### Adding a New Data Source

1. Add to `src/types/index.ts` → `SourceName` union
2. Add to `src/lib/constants.ts` → `SOURCE_LABELS` & `SOURCE_COLORS`
3. Add entry in `src/data/mockSources.ts`
4. Add daily column in `src/data/mockTrendData.ts`

### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add nav link in `src/components/layout/Navbar.tsx`
4. Wrap with `AdminRoute` if admin-only

### Adding a New Theme

1. Add theme name to `src/types/index.ts` → `Theme` union
2. Add CSS variables block in `src/index.css`
3. Add button in Navbar theme switcher

---

## 📋 Environment Variables (for backend)

When connecting to the provided Mongo API, you need the env vars listed earlier (`VITE_API_BASE_URL`, `MONGODB_URI`, etc.). Keep any sensitive keys out of source control.

---

## 🧪 Testing

```bash
npm run test        # Run vitest
npm run build       # Type-check + production build
npm run lint        # ESLint
```

## 🧑‍💻 Local Development Workflow

1. Run `npm run api` in Terminal A and leave it running; it hot-reloads via `tsx` when you edit `server/*`.
2. Run `npm run dev` in Terminal B for the Vite dev server (it chooses a free port automatically if 5173 is busy).
3. Keep the browser pointed to `/` (public dashboard) and `/trends` to monitor live analytics updates while you work.
4. When editing shared types in `src/types`, restart both processes so the server and client pick up the new contracts.
5. Use `npm run test -- --watch` for rapid feedback when touching hooks/components; Vitest respects the same tsconfig.
6. Before pushing, run `npm run lint && npm run test && npm run build` to ensure parity with CI.

## 📝 Implementation Checklist (Feature Readiness)

1. Live API reachable on `VITE_API_BASE_URL` with Mongo credentials configured.
2. `/api/incidents` returns at least 100 recent documents spanning multiple cities/hazards.
3. `/api/trends` responds for `7D`, `30D`, and `90D` ranges with realistic counts.
4. Public dashboard stats, feed, and heatmap load without mock fallbacks; map auto-zooms when a single city filter is active.
5. Trends page charts, city stats, and prediction cards reflect the live analytics payload.
6. Admin dashboard map and queue mirror the same dataset and accept status updates via `PATCH /api/incidents/:id`.
7. README/SETUP updated with any environment-specific notes from your deployment.
8. Vitest suite (`npm run test`) and type check (`npm run build`) complete successfully before shipping.

---

## 🛠 Troubleshooting

### MongoDB Atlas TLS errors (e.g., `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`)

1. Ensure your current public IP is in the Atlas **Network Access** list (Project → Network Access → Add IP Address).
2. Verify credentials with `mongosh "<MONGODB_URI>" --tls --tlsCAFile <atlas-ca.pem>`; download the CA file from Atlas → **Connect → Drivers**.
3. Upgrade to Node.js 18+ so the bundled OpenSSL supports TLS 1.2 (required by Atlas). Temporarily you can run `set NODE_OPTIONS=--openssl-legacy-provider`, but upgrading is the recommended fix.
4. Double-check the SRV URI includes your database name (e.g., `...mongodb.net/civic_hazard_db?retryWrites=true&w=majority`).
5. If you still see `ReplicaSetNoPrimary`, confirm the cluster is healthy in Atlas and that no VPC firewall is blocking port 27017.

### Google Maps not rendering

1. Confirm `VITE_GOOGLE_MAPS_API_KEY` exists in `.env` and has the **Maps JavaScript API** enabled.
2. Restrict the key to `http://localhost:*` (dev) and your production origins, then wait a few minutes for propagation.
3. If you see `RefererNotAllowedMapError`, re-check the HTTP referrer list in Google Cloud Console → APIs & Services → Credentials.

### Dev server port already in use

1. Vite will auto-select another port (see console output). If you want to pin it, run `npm run dev -- --port=5174`.
2. Stop lingering Node/Vite processes via Task Manager (Windows) or `lsof -i :5173` (macOS/Linux) + `kill`.

### “Mock data” showing after connecting the API

1. Verify `VITE_API_BASE_URL` starts with `http://localhost:4000/api` (or your deployed origin) and restart `npm run dev` after editing `.env`.
2. Check the browser network tab: frontend calls should hit `/api/*` and receive 200 responses; otherwise, inspect CORS or proxy issues.

---

## 📦 Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Framework  | React 18 + TypeScript                                   |
| Build      | Vite                                                    |
| Styling    | Tailwind CSS + CSS Variables                            |
| Components | shadcn/ui                                               |
| Charts     | Recharts                                                |
| Icons      | Lucide React                                            |
| Routing    | React Router DOM v6                                     |
| State      | React Context + useMemo/useCallback                     |
| Backend    | Express + MongoDB Atlas (can be swapped for your stack) |
