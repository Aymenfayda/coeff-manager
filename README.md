# CoeffManager

A platform to manage pricing coefficients per supplier + family, and apply them automatically to supplier product files where price or cost is missing.

## Features

- Import/manage a coefficient table (supplier, brand, family, coefficients)
- Upload supplier product files (CSV or Excel)
- Auto-detect and map columns, apply coefficients, flag unresolvable rows
- Export processed files as Excel with a summary sheet
- Processing history with re-export

## Local Development

### Option A — Single server (production mode)

```bat
cd coeff-manager
start.bat
```

Builds the frontend then starts one Node server at http://localhost:3003.

### Option B — Dev mode (two processes, hot reload)

```bat
cd coeff-manager
start-dev.bat
```

Backend at http://localhost:3003, Vite dev server at http://localhost:3002.

### Manual

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Build frontend
npm run build

# Start server
npm start
```

## Deploy to Render.com

1. Push this repository to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` — no manual config needed
5. Click **Deploy**

The app will be live at `https://<your-service-name>.onrender.com`

### What Render does automatically (via render.yaml)

| Step | Command |
|---|---|
| Build | `npm install && cd frontend && npm install && npm run build && cd ..` |
| Start | `node --max-old-space-size=512 backend/server.js` |
| Port | Read from `process.env.PORT` (set by Render) |
| Env | `NODE_ENV=production`, `NODE_OPTIONS=--max-old-space-size=512` |

### Important notes for Render free tier

- **Disk is ephemeral** — the SQLite database resets on each deploy/restart. For persistent data, replace `better-sqlite3` with a Render PostgreSQL add-on or use Render Disks (paid).
- **Cold starts** — free services spin down after 15 minutes of inactivity. First request after idle takes ~30 seconds.
- The `data/` folder is created at runtime; uploads are also ephemeral.

## Project Structure

```
coeff-manager/
├── backend/
│   ├── server.js          # Express server, serves API + built frontend
│   ├── db.js              # SQLite setup (Node built-in)
│   └── routes/
│       ├── coefficients.js
│       ├── process.js
│       └── history.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js         # fetch wrapper (relative /api base URL)
│   │   ├── pages/
│   │   └── components/
│   └── vite.config.js     # builds into backend/public
├── render.yaml            # Render deployment config
├── package.json           # root build + start scripts
└── start.bat              # Windows launcher
```
