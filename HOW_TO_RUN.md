# How to Run Meal Vista

Run these **three parts** (recipe-engine → backend → frontend). Use **3 terminals**.

---

## Prerequisites

- **Node.js** (for backend + frontend)
- **Python 3** (for recipe-engine)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or set `MONGO_URI` in `backend/.env`

---

## 1. Recipe engine (Python) — port 8000

AI recipe search/generation. Run first so the backend can call it.

```bash
cd recipe-engine
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and add keys (optional but recommended for AI features):

- `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/)
- `GROQ_API_KEY` — [Groq Console](https://console.groq.com/keys) (optional fallback)

Then:

```bash
python run.py
```

You should see: `Uvicorn running on http://0.0.0.0:8000`  
Check: open **http://localhost:8000/health** — should return `{"status":"healthy",...}`

---

## 2. Backend (Node.js) — port 5000

API, auth, and database. Needs MongoDB and (optionally) recipe-engine.

```bash
cd backend
npm install
```

Ensure `backend/.env` exists with at least:

- `PORT=5000`
- `MONGO_URI=mongodb://127.0.0.1:27017/authDB` (or your MongoDB URL)

Optional: `AI_RECIPE_ENGINE_URL=http://localhost:8000` (default if not set).

Then:

```bash
npm run dev
```

Or: `npm start`  
You should see the server listening on port 5000 and (if set) “AI Engine: http://localhost:8000”.

---

## 3. Frontend (Expo / React Native)

Mobile app. Points to the backend via `EXPO_PUBLIC_API_URL`.

```bash
cd frontend
npm install
```

In `frontend/.env` set the backend URL:

- **Same machine:** `EXPO_PUBLIC_API_URL=http://localhost:5000`
- **Phone/emulator (other device):** use your PC’s LAN IP, e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.20:5000`

Then:

```bash
npx expo start
```

From the Expo CLI you can press **a** for Android, **i** for iOS, or scan the QR code with Expo Go.

---

## Summary

| Part           | Directory      | Command           | Port |
|----------------|----------------|-------------------|------|
| Recipe engine  | `recipe-engine` | `python run.py`   | 8000 |
| Backend        | `backend`      | `npm run dev`     | 5000 |
| Frontend       | `frontend`     | `npx expo start`  | 8081 (Expo) |

**Order:** 1 → 2 → 3. Keep all three running while you use the app.

**Quick check:**

- Recipe engine: http://localhost:8000/health  
- Backend: http://localhost:5000 (or the root/health route your backend exposes)  
- Frontend: Expo dev server in the terminal
