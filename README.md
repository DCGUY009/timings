# Timings ⏱️

**Timings** is a sleek, open‑source web app that helps users create, organize, and track daily routines.  It combines a modern Vite + React frontend with a type‑safe Supabase backend for authentication and real‑time data sync.

> 🌐 **Live at [timings.online](https://timings.online)** — open it in your browser and start building routines right away.

---

## ✨ Features
- Google & email/password sign‑in via Supabase Auth
- Real‑time updates across devices (tables: `profiles`, `routines`, `routine_steps`, …)
- State management with **Zustand** (store located in `Backend/integration_guides/useRoutineStore.ts`)
- Fully typed Supabase client (`Backend/integration_guides/supabaseClient.ts`)
- Responsive UI built with Vite, TypeScript, and Tailwind‑like styling

---

## 🚀 Getting Started (for end users)
1. **Visit [timings.online](https://timings.online)** in your browser — no install needed.
2. **Sign in** using Google or an email/password.
3. **Create a routine**, add steps, and start the timer.
4. **Track your progress** on the dashboard to see streaks and history.

---

## 🛠️ Development Guide (for contributors)
```bash
# Clone the repo
git clone https://github.com/DCGUY009/timings.git
cd timings

# Install frontend dependencies
cd Frontend
npm ci

# Set up a local environment file (git‑ignored)
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Run the dev server
npm run dev   # http://localhost:5173
```

The frontend reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local`. The backend integration guides in `Backend/integration_guides/` provide the typed client and Zustand store.

---

## 📦 Deployment (quick snapshot)
Add a GitHub Actions workflow at `.github/workflows/deploy.yml` (see the previous README for a full example). Store your Supabase credentials as **GitHub Secrets** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). The workflow builds the Vite app and publishes the `dist/` folder to GitHub Pages.

---

## 📂 Repository Layout
```
Timings/
├─ Backend/                     # Supabase schema & integration guides
│   ├─ supabase_schema.sql
│   └─ integration_guides/
│       ├─ database.types.ts
│       ├─ supabaseClient.ts
│       └─ useRoutineStore.ts
├─ Frontend/                    # Vite + React UI
│   ├─ src/ (components, store, utils)
│   ├─ index.html
│   └─ vite.config.ts
├─ .env.example                 # Placeholder env file
├─ LICENSE                      # MIT License (see LICENSE file)
└─ README.md                    # ← this file
```

---

## 📄 License
This project is released under the **MIT License**. See the `LICENSE` file for full terms.

---

*Happy building!* 🎉
