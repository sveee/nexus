# Nexus — ML Dashboard

A beautiful, real-time ML intelligence dashboard built with React + TypeScript + SQLite.

## Features

| Section   | Source                              | Refresh |
|-----------|-------------------------------------|---------|
| Papers    | HuggingFace papers (weekly)        | 8h cache |
| Models    | HF trending models API             | 8h cache |
| GitHub    | GitHub trending (weekly)           | 8h cache |
| Datasets  | HF trending datasets API           | 8h cache |
| Reddit    | r/LocalLLaMA + r/LocalLLM top/week | 8h cache |

## Run (development)

```bash
npm install
npm run dev
```

Opens:
- **UI** → http://localhost:5173
- **API** → http://localhost:3001/api/papers

## Deploy (Docker)

The production server (built UI + API on one Express process) ships as a single
container. SQLite cache lives in the `./data` volume, so it survives restarts.

### Anywhere — standalone

```bash
cp .env.example .env        # optional: change HOST_PORT
docker compose up -d --build
```

Then open **http://localhost:3001** (or whatever `HOST_PORT` you set). That's all
that's needed on a fresh machine — no reverse proxy or external network required.

### Behind a Caddy reverse proxy

If you already run Caddy on a shared `caddy-network`, layer the overlay so the
container also joins that network and Caddy can proxy to it by name:

```bash
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```

Example Caddyfile entry:

```
nexus.example.com {
    reverse_proxy nexus:3001
}
```

## API Endpoints

```
GET /api/papers    - HuggingFace weekly papers
GET /api/models    - HF trending models
GET /api/github    - GitHub trending repos
GET /api/datasets  - HF trending datasets
GET /api/reddit    - Reddit LocalLLaMA + LocalLLM posts
```

Add `?refresh=true` to bypass the 8-hour SQLite cache and force a live fetch.

## Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express + TypeScript (tsx)
- **Cache**: SQLite via better-sqlite3
- **Scraping**: cheerio (GitHub + HF papers)
- **Icons**: lucide-react
