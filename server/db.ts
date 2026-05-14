import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'nexus.db')
  : path.join(__dirname, '../nexus.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    key        TEXT    PRIMARY KEY,
    data       TEXT    NOT NULL,
    fetched_at INTEGER NOT NULL
  )
`);

const CACHE_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  isStale: boolean;
}

export function getCached<T>(key: string): CacheEntry<T> | null {
  const row = db
    .prepare('SELECT data, fetched_at FROM cache WHERE key = ?')
    .get(key) as { data: string; fetched_at: number } | undefined;

  if (!row) return null;

  return {
    data: JSON.parse(row.data) as T,
    fetchedAt: row.fetched_at,
    isStale: Date.now() - row.fetched_at > CACHE_TTL_MS,
  };
}

export function setCached(key: string, data: unknown): void {
  db.prepare(
    'INSERT OR REPLACE INTO cache (key, data, fetched_at) VALUES (?, ?, ?)'
  ).run(key, JSON.stringify(data), Date.now());
}

export default db;
