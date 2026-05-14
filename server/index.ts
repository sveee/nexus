import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCached, setCached } from './db.js';
import { fetchPapers } from './scrapers/papers.js';
import { fetchGitHubTrending } from './scrapers/github.js';
import { fetchHFModels, fetchHFDatasets } from './scrapers/hf.js';
import { fetchSubredditPosts } from './scrapers/reddit.js';
import { fetchKarpathyTweets } from './scrapers/karpathy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

type Fetcher<T> = () => Promise<T>;

async function withCache<T>(
  key: string,
  fetcher: Fetcher<T>,
  forceRefresh = false
): Promise<{ data: T; fetchedAt: number; isStale: boolean }> {
  const cached = getCached<T>(key);

  if (cached && !cached.isStale && !forceRefresh) {
    return cached;
  }

  try {
    const data = await fetcher();
    setCached(key, data);
    return { data, fetchedAt: Date.now(), isStale: false };
  } catch (err) {
    if (cached) {
      console.error(`[${key}] fetch failed, serving stale cache:`, err);
      return { ...cached, isStale: true };
    }
    throw err;
  }
}

app.get('/api/papers', async (req, res) => {
  try {
    const refresh = req.query['refresh'] === 'true';
    const result = await withCache('papers', () => fetchPapers('weekly', 20), refresh);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/models', async (req, res) => {
  try {
    const refresh = req.query['refresh'] === 'true';
    const result = await withCache('models', () => fetchHFModels(20), refresh);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/github', async (req, res) => {
  try {
    const refresh = req.query['refresh'] === 'true';
    const result = await withCache('github', () => fetchGitHubTrending('weekly'), refresh);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/datasets', async (req, res) => {
  try {
    const refresh = req.query['refresh'] === 'true';
    const result = await withCache('datasets', () => fetchHFDatasets(20), refresh);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/reddit', async (req, res) => {
  try {
    const refresh = req.query['refresh'] === 'true';
    const result = await withCache(
      'reddit',
      async () => {
        const [llama, llm] = await Promise.all([
          fetchSubredditPosts('LocalLLaMA', 25),
          fetchSubredditPosts('LocalLLM', 15),
        ]);
        return { LocalLLaMA: llama, LocalLLM: llm };
      },
      refresh
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/paper-summary', async (req, res) => {
  const id = req.query['id'] as string;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const result = await withCache(`paper-summary:${id}`, async () => {
      const r = await fetch(`https://huggingface.co/api/papers/${id}`);
      if (!r.ok) throw new Error(`HF papers API ${r.status}`);
      const data = await r.json() as { ai_summary?: string; summary?: string; ai_keywords?: string[] };
      return {
        ai_summary: data.ai_summary ?? data.summary ?? null,
        ai_keywords: data.ai_keywords ?? [],
      };
    }, false);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/karpathy', async (req, res) => {
  try {
    const refresh = req.query['refresh'] === 'true';
    const result = await withCache('karpathy', () => fetchKarpathyTweets(20), refresh);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Serve Vite build in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🔮 Nexus ML Dashboard`);
  console.log(`  ➜  API: http://localhost:${PORT}/api/papers`);
  console.log(`  ➜  UI:  http://localhost:5173 (via Vite)\n`);
});
