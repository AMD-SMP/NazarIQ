# NazarIQ Implementation Tasks

## How to Execute

- Work top-to-bottom by sprint.
- Keep PRs small (one feature area per PR).
- After each completed task: run `npm run lint`, `npm run test`, and `npm run build`.

## Current Execution Plan (Q1 2026)

1. **Analytics Hardening**
   - Keep `/trends` backed by Mongo aggregations; monitor response size (<=12 KB) and add pagination if it grows.
   - Port the admin stats/widgets to use the same analytics response (shared util already lives in `server/trendAnalytics.ts`).
   - Track bundle size impact; consider lazy-loading the chart stack once data parity is verified.
2. **Map UX (Auto Zoom + Context)**
   - Public dashboard already focuses when a single city filter is active; replicate for any admin filter view once designed.
   - Introduce a “Reset view” control that pans back to India bounds when multiple cities are selected again.
   - Explore clustering styles (heatmap vs markers) for high-density metros.
3. **Admin Data Parity**
   - Replace mock alerts/activity endpoints with backend routes; capture optimistic updates for read/dismiss.
   - Wire incident status mutations to the Express API (already supports `PATCH /api/incidents/:id`).
   - Add integration tests that log in as admin and verify real data flows.
4. **Documentation & Ops**
   - Keep `SETUP.md` and this plan updated when ports/env vars change.
   - Add runbooks for TLS fixes, Google Maps quotas, and CI alerts.
   - Ship a “deploy playbook” once hosting targets are finalized.

## Sprint A — Foundation (Stability First)

- [x] Fix current ESLint **errors** blocking a clean baseline
- [x] Resolve high-value ESLint warnings (fast-refresh exports + hook dependencies)
- [x] Add strict shared chart/auth API types in `src/types/index.ts`
- [x] Add `src/lib/apiClient.ts` with env-based base URL (`VITE_API_BASE_URL`)
- [x] Create `src/lib/queryKeys.ts` for consistent react-query keys

## Sprint B — Public Experience

### Dashboard (`/`)

- [x] Move incidents list from mock context to API-backed query
- [x] Wire search/city/severity/hazard/status filters to query params
- [x] Add loading state skeletons for KPI cards, map, and feed
- [x] Add API error empty-state with retry action
- [x] Keep current sorting behavior (`newest`, `critical`, `risk`) on fetched data

### Incident Detail (`/incident/:id`)

- [x] Fetch incident by ID from API route
- [x] Fetch timeline + evidence from API and map to existing UI model
- [x] Add not-found handling for invalid IDs from backend response

### Trends (`/trends`)

- [x] Replace `mockTrendData` with analytics endpoint data
- [x] Add server-driven date range selector (7D/30D/90D)
- [x] Ensure charts degrade gracefully when partial data is returned

## Sprint C — Auth, RBAC, and Admin

### Login (`/login`)

1. [x] Finalize router wiring so `/login` renders outside the main dashboard shell (`src/App.tsx`) and the Navbar CTA always lands on that screen.
2. [x] Replace the demo `AuthContext` login with the target identity provider (hook into `AuthContext` + `LoginPage`).
3. [x] Implement form validation + error surfacing with `react-hook-form` + `zod` for email/password inputs.
4. [x] Persist session tokens (localStorage/secure cookies) and hydrate `AuthContext` on refresh/logout.
5. [ ] Add regression tests that cover public → admin navigation, unauthenticated redirects, and citizen signup/login flows.
6. [ ] Add `/signup` surface so citizens can register credentials and feed them into the new auth provider.

### Admin Ops (`/admin`)

1. [ ] Swap mock data in `AdminDashboard` for the real alerts/activity endpoints (query + error states).
2. [ ] Wire notification read/dismiss mutations to the backend and optimistically update cached data.
3. [ ] Connect the priority queue/live feed to the incidents API so it stays in sync with field updates.
4. [ ] Cover the `/admin` surface with integration tests for RBAC + data loading failures.

### Incident Management (`/admin/incidents`)

1. [x] Replace local mutation placeholders with the actual status-update API (optimistic UI + error rollback).
2. [x] Hook the bulk action UI to the backend batch endpoint and surface progress/errors in the UI.
3. [ ] Emit audit events for every admin action and display the confirmation toast/state change.
4. [x] Add tests that cover single vs bulk updates plus RBAC enforcement on this route.

## Sprint D — Testing & Quality

- [ ] Add unit tests for `AuthContext`, `FilterContext`, and `ThemeContext`
- [ ] Add integration tests for dashboard filter and sort behavior
- [x] Add integration tests for admin status change + bulk actions
- [ ] Add route-level smoke tests for public/admin navigation

## Sprint E — Performance & Release

- [ ] Introduce code splitting for heavy routes/charts to reduce main bundle size
- [ ] Add bundle analysis and set bundle-size budget in CI
- [ ] Update dependencies in controlled batches (minor first, then majors)
- [ ] Run UAT checklist page-by-page before release

## Branding & Metadata Polish

- [ ] Update the document `<title>` in index.html to the real application name
- [ ] Align `og:title`/`og:description` meta tags with final marketing copy

## Definition of Done (for each feature)

- [ ] UI behavior matches design intent
- [ ] Data is fetched from backend (no mock fallback in production path)
- [ ] Loading, empty, and error states implemented
- [ ] Tests updated/added and passing
- [ ] Lint/build passing
