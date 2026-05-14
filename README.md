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

## Run

```bash
npm run dev
```

Opens:
- **UI** → http://localhost:5173
- **API** → http://localhost:3001/api/papers

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
