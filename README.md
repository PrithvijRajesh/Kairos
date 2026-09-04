# Kairos

Personal running + strength app. Plans your week, guides lift/core/stretch sessions, and logs progress — mostly **offline on your phone**.

```
frontend/   → Expo / React Native app (TypeScript)
backend/    → Optional API for run plans + goals sync (Express + SQLite)
```

**Program start:** Monday **Aug 24, 2026** = Core Workout **A** + Lift **Push** (Day 1). The app applies this automatically on first launch after update.

---

## What you get

| Area | What it does |
|------|----------------|
| **Goals** | Running + gym goals with importance split (local first, syncs to API when home) |
| **Dashboard** | Today's run (API) + today's lift (offline PPLUL) + tiles for Run / Lift / Core / Stretch |
| **Lift** | Push → Pull → Legs → Rest → Upper → Lower → Rest; sets, warm-ups, swaps, progression |
| **Google Sheets** | Gym log at the gym without Expo — Push/Pull/Legs/Upper/Lower tabs + Progress |
| **Core** | 4-day rotation (A→B→C→D): bracing, anti-rotation, run stability, endurance |
| **Stretch** | 4 mobility routines with timers + streak |
| **Check-in** | Energy/soreness can skip optional cardio when you’re tired |

---

## Daily use (simple)

### Every day
1. Open app → **Dashboard** shows today's run + lift.
2. Optional: **Check-in** if you’re beat up — the plan can skip optional cardio.

### Lift day (at home first)
1. **Lift → Worksheet → Send today's blank rows to Sheets** (needs Wi‑Fi once).
2. At gym: open Google Sheets → today's tab (e.g. **Push**) → fill **Weight + Reps** (yellow).
3. No need to upload — the Sheet *is* your log. Progress tab updates when you send rows from home.

### Lift day (in app, when Expo works)
1. **Lift → Start session** → log sets → complete.
2. Optional: **Send completed session to Sheets** on complete or worksheet screen.

### Core (any day, ~16 min)
1. **Core** → today's workout (A/B/C/D rotates from program start).
2. **Start workout** → follow timers → **Review** (easy/perfect/hard) → levels adjust.

### Stretch
1. **Stretch** → pick routine → session timers → done.

### Cardio (optional — stay in shape)
1. **Cardio** → pick **Run / Treadmill / Bike**, then **Chill / Normal / A little farther**.
2. The app recommends miles from your last run (and how long ago). After a week off it steps you back.
3. Log the session. Next time the rec updates.
4. **Training plan** runs a 4-mile easy test first, then builds a week from your time.

---

## Weekly schedules

### Lift (offline — what the Lift tile uses)

| Day | Session |
|-----|---------|
| 1 | Push |
| 2 | Pull |
| 3 | Legs |
| 4 | Rest |
| 5 | Upper |
| 6 | Lower |
| 7 | Rest |

Repeats from **Aug 24, 2026**.

### Cardio (optional)

Default split is **gym 75% / running 25%**. Lifting is required. Cardio is not.

| When | What |
|------|------|
| Chill phase | Run, treadmill, or bike · light / normal / farther |
| Mileage | Sized from last run + days since (no jumping back onto old volume) |
| Bike | Time instead of miles (~8 min per run-mile) |
| Training plan | 4-mile easy test, then a week matched to fitness |

---
### Core (offline)

| Day | Workout | Focus |
|-----|---------|--------|
| A | Bracing | Planks, dead bug, glute bridge — trunk stability |
| B | Anti-rotation | Pallof, bird dog, leg lowers — running gait |
| C | Run stability | Hips, Copenhagen, single-leg glute — lateral chain |
| D | Endurance | Holds under fatigue |

Rotates A → B → C → D from program start.

---

## Setup (one time)

### Mac prerequisites

Install **Node.js 20+** (includes npm):

```bash
brew install node
```

Or download from [nodejs.org](https://nodejs.org).

Then install project dependencies:

```bash
cd /path/to/Kairos
chmod +x setup-mac.sh
./setup-mac.sh
```

See `requirements.txt` for the full checklist.

### 1. Backend (optional — for run plan + goals sync)

```bash
cd backend
npm install
npm run dev
```

Health: `http://localhost:3000/api/health`

### 2. Frontend

```bash
cd frontend
npm install
npx expo start
```

First launch: set goals → Dashboard.

### 3. Phone on same Wi‑Fi as PC

Create `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:3000/api
```

Use `ipconfig getifaddr en0` (Mac Wi‑Fi) or `ifconfig` for your LAN IP. Restart Expo after editing.

**Lift / Core / Stretch work without the API.** Run + Week plan need the backend.

### 4. Google Sheets (recommended for gym)

1. New Sheet → **Extensions → Apps Script** → paste `frontend/googleSheetsAppsScript.js` → Save.
2. **Deploy → Web app** (Execute as: Me, Access: Anyone).
3. Copy URL → **Settings → Google Sheets** → Save.
4. **Lift → Worksheet → Send blank rows** before the gym.

After script updates: Deploy → Manage → Edit → **New version** → Deploy.

---

## Settings cheat sheet

| Setting | Effect |
|---------|--------|
| **Set both to Mon Aug 24, 2026** | Core A + Lift Push start that Monday |
| Core start date | When Workout A begins (A→B→C→D rotation) |
| Lift start date | When Push begins (PPLUL rotation) |
| Sheets URL | Where workout rows are sent |
| Dark mode | Theme |

---

## Progression rules

**Lift:** Hit top of rep range on all working sets → add weight next time. Leave ~1–2 reps in reserve.

**Core:** After each workout, rate exercises easy / perfect / hard → levels and hold times adjust.

---

## API (optional)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Server status |
| GET/PUT | `/api/goals` | Goals |
| GET | `/api/plan/today` | Today's run plan |
| GET | `/api/plan/week` | Week plan |
| POST | `/api/check-in` | Daily check-in |
| POST | `/api/logs/run` | Log run |
| POST | `/api/logs/gym` | Log lift (from in-app sync) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Dashboard lift ≠ Lift screen | Tap **Set both to Mon Aug 24, 2026** in Settings |
| Expo dies at gym | Use Google Sheets worksheet flow |
| Sheets columns wrong | Redeploy Apps Script, clear old Log tab once |
| Wrong lift day | Settings → Lift start date → `2026-08-24` or reset button |
| Run/Week empty | Start backend + set `EXPO_PUBLIC_API_URL` |

---

## Project structure

```
frontend/
  app/              Screens (dashboard, lift, core, stretch, run, settings)
  gymWorkouts.ts    Lift program (PPLUL)
  coreWorkouts.ts   Core A–D + exercise library
  stretchRoutines.ts
  googleSheetsAppsScript.js
  programConfig.ts  Shared start date (2026-08-24)
backend/
  planEngine.ts     Adaptive run/gym week templates
  workouts.ts       Run + legacy gym templates for API
```
