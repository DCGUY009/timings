# Timings ⏱️

A modern routine‑tracking web app built with **Vite + React**, **Zustand**, and **Supabase** for authentication and data storage.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Setup – Local Development](#setup--local-development)
4. [Building for Production](#building-for-production)
5. [Deploying with GitHub Actions (GitHub Pages / Vercel)](#deploying-with-github-actions)
6. [Environment Variables & Secrets](#environment-variables--secrets)
7. [Repository Structure](#repository-structure)
8. [License](#license)

---

## Project Overview
Timings lets users create, edit, and run custom routines. Key features include:
- Google & email/password authentication via Supabase Auth
- Real‑time data sync with Supabase tables (`profiles`, `routines`, etc.)
- State persistence using a **Zustand** store (`useRoutineStore.ts`)
- Fully type‑safe Supabase client (`supabaseClient.ts`)

The app is organized into two main folders:
- **`Frontend/`** – React UI, built with Vite.
- **`Backend/`** – Supabase schema, integration guides, and documentation.

---

## Prerequisites
| Tool | Minimum Version |
|------|-----------------|
| Node.js | 20.x |
| npm | 10.x |
| Git | 2.40+ |
| Supabase account | – |
| GitHub repository | – |

> **Note:** The repo now contains **no hard‑coded secrets**. All credentials must be supplied via environment variables or GitHub Secrets.

---

## Setup – Local Development
```bash
# Clone the repo
git clone https://github.com/DCGUY009/timings.git
cd timings

# Install frontend dependencies
cd Frontend
npm ci

# Create a .env.local (git‑ignored) – see the section below for required keys
cp .env.example .env.local
# Edit .env.local with your Supabase URL & anon key
```

Start the dev server:
```bash
npm run dev
# Vite will be reachable at http://localhost:5173
```

---

## Building for Production
```bash
# From the Frontend folder
npm run build
# Output goes to Frontend/dist
```
The generated static bundle can be served by any static host (GitHub Pages, Vercel, Netlify, Cloudflare Workers, etc.).

---

## Deploying with GitHub Actions
Add a workflow file at `.github/workflows/deploy.yml`:
```yaml
name: Deploy Timings to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        working-directory: ./Frontend
        run: npm ci
      - name: Build
        working-directory: ./Frontend
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./Frontend/dist
          force_orphan: true
```

### GitHub Secrets
In **Settings → Secrets and variables → Actions** add:
- `VITE_SUPABASE_URL` – your Supabase project URL (e.g. `https://<ref>.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` – the public anon key from Supabase Settings → API.

### Enable GitHub Pages
After the workflow runs successfully, go to **Settings → Pages**, set **Source** to the `gh-pages` branch (created by the workflow), and select the root (`/`). Your app will be live at `https://<username>.github.io/timings/`.

---

## Environment Variables & Secrets
- **`.env.example`** – shipped with placeholders.
- **`.env.local`** – used locally; ignored via `.gitignore` (`*.env*`).
- **GitHub Secrets** – used by CI/CD; never commit real keys.

All other credentials (service‑role keys, private API keys) should never be committed. Add any new secrets to GitHub Secrets and reference them via `${{ secrets.YOUR_SECRET }}` in the workflow.

---

## Repository Structure
```
 timings/
 ├─ Backend/
 │   ├─ README.md                 # Supabase‑cloud setup guide
 │   ├─ supabase_schema.sql       # DB schema, RLS policies, seeds
 │   └─ integration_guides/
 │        ├─ database.types.ts    # Types generated from Supabase
 │        ├─ supabaseClient.ts   # Typed Supabase client (no hard‑coded secrets)
 │        └─ useRoutineStore.ts  # Zustand store with Supabase sync
 ├─ Frontend/
 │   ├─ src/                      # React components, utils, store
 │   ├─ index.html
 │   ├─ vite.config.ts
 │   └─ package.json
 ├─ .gitignore
 ├─ .env.example
 ├─ README.md                    # ← this file
 └─ (other config files)
```

---

## License
```
MIT License

Copyright (c) 2026 Timings developers

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON‑INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

**Can you monetize under MIT?**
- Yes. The MIT license explicitly allows commercial use, selling the software, and incorporating it into proprietary products.
- If you later want a more restrictive license, you would need to replace the MIT file and ensure all contributors agree, but you can still keep the MIT license and monetize without any changes.

---

### What to do next?
1. Commit this README (`git add README.md && git commit -m "docs: add project README with deployment guide"`).
2. Add the GitHub Actions workflow (`.github/workflows/deploy.yml`).
3. Add the required GitHub Secrets.
4. Push to `main`; the workflow will build and publish the site.
5. Optionally, update the LICENSE file if you decide to change the licensing model.

Happy building! 🎉
