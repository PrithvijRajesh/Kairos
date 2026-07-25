# Kairos

Running + gym workout app.

```
frontend/   → mobile app (Expo)
backend/    → API server + workout plans (SQLite)
```

## Quick start (today)

You need **two terminals**.

### 1. Backend API

```powershell
cd backend
npm install
npm run dev
```

API runs at `http://localhost:3000`. Health check: `http://localhost:3000/api/health`

### 2. Frontend (Expo)

```powershell
cd frontend
npm install
npx expo start
```

Set goals on first launch → dashboard shows today's run/lift plan from the backend.

### Phone on same Wi‑Fi

`localhost` won't work on a physical device. Create `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:3000/api
```

Find your IP: `ipconfig` (Windows) → use the IPv4 address (e.g. `192.168.1.42`).

Restart Expo after changing `.env`.

## What the backend does

- **Goals** — save running/gym goals and importance split
- **Plan engine** — weekly run + lift schedule based on your split
- **Check-ins** — energy/soreness adjusts hard sessions to easier variants
- **Logs** — record completed runs and gym sessions

Core workouts stay on-device (`frontend/coreWorkouts.ts`). Run/lift plans come from the API.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Server status |
| GET/PUT | `/api/goals` | Read/save goals |
| GET | `/api/plan/today` | Today's plan |
| GET | `/api/plan/week` | This week's plan |
| POST | `/api/check-in` | Daily check-in |
| POST | `/api/logs/run` | Log a run |
| POST | `/api/logs/gym` | Log gym session |
