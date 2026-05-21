import type { ApiResult, Paper, HFModel, HFDataset, GitHubRepo, RedditData, KarpathyTweet, PaperSummary, BenchmarksData } from './types';

async function get<T>(path: string, refresh = false): Promise<ApiResult<T>> {
  const url = refresh ? `${path}?refresh=true` : path;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error: string }).error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  papers:       (refresh?: boolean) => get<Paper[]>('/api/papers', refresh),
  models:       (refresh?: boolean) => get<HFModel[]>('/api/models', refresh),
  github:       (refresh?: boolean) => get<GitHubRepo[]>('/api/github', refresh),
  datasets:     (refresh?: boolean) => get<HFDataset[]>('/api/datasets', refresh),
  reddit:       (refresh?: boolean) => get<RedditData>('/api/reddit', refresh),
  karpathy:     (refresh?: boolean) => get<KarpathyTweet[]>('/api/karpathy', refresh),
  benchmarks:   (refresh?: boolean) => get<BenchmarksData>('/api/benchmarks', refresh),
  paperSummary: (id: string)        => get<PaperSummary>(`/api/paper-summary?id=${encodeURIComponent(id)}`),
};
