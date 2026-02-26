# NazarIQ — Setup & Project Structure Guide

> **AI-Powered Civic Hazard Intelligence Dashboard**
> "Watchful Intelligence for Every City"

---

## 🚀 Quick Start (Frontend Only)

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd nazariq

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173` with hot-reload enabled.

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
├── data/                # Mock data (replace with API calls)
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
│   ├── utils.ts                 # Utility functions (cn, etc.)
│   └── constants.ts             # Colors, labels, city coordinates
│
├── App.tsx                      # Router + provider tree
├── main.tsx                     # Entry point
└── index.css                    # Tailwind + 3 theme definitions + animations
```

---

## 🎨 Design System & Theming

### Three Themes
| Theme | Class | Description |
|-------|-------|-------------|
| Command | `.theme-command` | Dark ops-center (default) |
| Municipal | `.theme-municipal` | Light government-friendly |
| Contrast | `.theme-contrast` | High-contrast accessibility |

Themes use CSS custom properties in `src/index.css`. All components use semantic tokens (`--background`, `--foreground`, `--primary`, etc.) — never raw colors.

### Hazard Type Colors
Each of the 9 hazard types has a unique signature color defined in both `index.css` (as HSL vars) and `constants.ts` (as hex for Recharts):

| Type | Color |
|------|-------|
| POTHOLE | `#FF6B6B` |
| WATERLOGGING | `#4ECDC4` |
| FALLEN_TREE | `#45B7D1` |
| ROAD_COLLAPSE | `#FF4757` |
| CONSTRUCTION_ZONE | `#FFA502` |
| STRUCTURAL_FAILURE | `#A55EEA` |
| DEBRIS | `#778CA3` |
| SEWAGE_OVERFLOW | `#26DE81` |
| OTHER | `#B0BEC5` |

---

## 🔌 Backend Integration Guide

The frontend is fully functional with mock data. To connect a real backend:

### Step 1: Enable Lovable Cloud (Recommended)

In Lovable, enable Cloud to get a managed backend with:
- **PostgreSQL database** for incidents, sources, alerts
- **Authentication** for admin login (email/password)
- **Edge Functions** for NLP processing, alert dispatch
- **Real-time subscriptions** for live incident updates

### Step 2: Database Schema

Create these tables to replace mock data:

```sql
-- Incidents table
CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('POTHOLE','WATERLOGGING','FALLEN_TREE','ROAD_COLLAPSE','CONSTRUCTION_ZONE','STRUCTURAL_FAILURE','DEBRIS','SEWAGE_OVERFLOW','OTHER')),
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  risk_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DETECTED' CHECK (status IN ('DETECTED','ALERTED','IN_PROGRESS','RESOLVED')),
  source TEXT,
  source_url TEXT,
  raw_excerpt TEXT,
  confidence_score INTEGER DEFAULT 0,
  corroborating_reports INTEGER DEFAULT 0,
  ai_summary TEXT,
  assigned_to TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Timeline entries
CREATE TABLE incident_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT REFERENCES incidents(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  note TEXT,
  admin_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data sources
CREATE TABLE sources (
  name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  reliability DOUBLE PRECISION DEFAULT 0,
  total_reports INTEGER DEFAULT 0,
  verified_reports INTEGER DEFAULT 0,
  false_reports INTEGER DEFAULT 0,
  status TEXT DEFAULT 'MONITORING',
  trend JSONB DEFAULT '[]'
);

-- Alerts
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  incident_id TEXT REFERENCES incidents(id),
  priority TEXT,
  target_cities JSONB DEFAULT '[]',
  message TEXT,
  sent_by TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'SENT'
);

-- Activity log
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  admin_name TEXT,
  action TEXT NOT NULL,
  incident_id TEXT REFERENCES incidents(id),
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Replace Mock Data with API Calls

Each mock data file maps to a database table:

| Mock File | Table | Context Hook |
|-----------|-------|--------------|
| `mockIncidents.ts` | `incidents` + `incident_timeline` | `FilterContext.tsx` |
| `mockSources.ts` | `sources` | New `SourceContext` |
| `mockAlerts.ts` | `alerts` | New `AlertContext` |
| `mockActivityLog.ts` | `activity_log` | Admin pages |
| `mockTrendData.ts` | Aggregation queries | `TrendsPage.tsx` |

Example replacement in `FilterContext.tsx`:

```tsx
// Before (mock)
import { mockIncidents } from '@/data/mockIncidents'
const [incidents, setIncidents] = useState(mockIncidents)

// After (Supabase via Lovable Cloud)
import { supabase } from '@/integrations/supabase/client'

const [incidents, setIncidents] = useState<Incident[]>([])

useEffect(() => {
  const fetchIncidents = async () => {
    const { data } = await supabase
      .from('incidents')
      .select('*, incident_timeline(*)')
      .order('created_at', { ascending: false })
    if (data) setIncidents(transformToIncident(data))
  }
  fetchIncidents()

  // Real-time subscription
  const channel = supabase
    .channel('incidents')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, fetchIncidents)
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

### Step 4: Authentication

Replace `AuthContext.tsx` mock login with real auth:

```tsx
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
})

// Sign out
await supabase.auth.signOut()

// Session listener
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null)
})
```

### Step 5: Edge Functions for AI Features

Create edge functions for:

| Function | Purpose |
|----------|---------|
| `ingest-source` | Fetch & parse data from RSS/social feeds |
| `classify-hazard` | NLP-based hazard type classification |
| `compute-risk-score` | Calculate risk score from multiple signals |
| `send-alert` | Dispatch alerts via email/SMS/webhook |
| `generate-summary` | AI-powered incident summarization |

### Step 6: Row Level Security (RLS)

```sql
-- Public can read incidents
CREATE POLICY "Public read" ON incidents FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admin write" ON incidents FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Activity log: admin insert only
CREATE POLICY "Admin log" ON activity_log FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

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

When connecting to a backend, you'll need:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For edge functions with external APIs:

```env
# Added as secrets in Lovable Cloud
OPENAI_API_KEY=sk-...          # For AI summarization
SENDGRID_API_KEY=SG...         # For email alerts
TWILIO_AUTH_TOKEN=...          # For SMS alerts
```

---

## 🧪 Testing

```bash
npm run test        # Run vitest
npm run build       # Type-check + production build
npm run lint        # ESLint
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + CSS Variables |
| Components | shadcn/ui |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router DOM v6 |
| State | React Context + useMemo/useCallback |
| Backend (optional) | Lovable Cloud (PostgreSQL + Auth + Edge Functions) |
