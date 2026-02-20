# WorkManager Frontend

## Setup

```bash
# Install dependencies
npm install

# Run dev server (proxies /api to localhost:8000)
npm run dev

# Build for production (output goes to dist/)
npm run build
```

## Deployment on Render (Single Service)

The Flask backend serves this frontend. Build command for Render backend service:

```
cd ../frontend && npm install && npm run build && cp -r dist ../backend/dist && cd ../backend && pip install -r requirements.txt
```

Start command:
```
gunicorn app:app
```

## Key Architecture

- `baseURL: '/api'` — all requests go to the same origin (no CORS issues)
- Auth uses HttpOnly cookies — no localStorage
- `initAuth()` calls `/api/auth/me` on mount to restore session
- Axios interceptor auto-refreshes expired tokens
