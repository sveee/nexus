export interface HFModel {
  id: string;
  author: string;
  likes: number;
  downloads: number;
  pipeline_tag?: string;
  lastModified?: string;
}

export interface HFDataset {
  id: string;
  author: string;
  likes: number;
  downloads: number;
  lastModified?: string;
}

interface TrendingRepoData {
  id: string;
  author: string;
  likes: number;
  downloads: number;
  pipeline_tag?: string;
  lastModified?: string;
}

interface TrendingItem {
  repoData: TrendingRepoData;
}

async function fetchTrending(type: 'model' | 'dataset', limit = 20): Promise<TrendingItem[]> {
  const cappedLimit = Math.min(limit, 20); // HF API max is 20
  const url = `https://huggingface.co/api/trending?limit=${cappedLimit}&type=${type}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NexusDashboard/1.0' },
  });
  if (!res.ok) throw new Error(`HF trending API responded ${res.status}`);
  const json = (await res.json()) as { recentlyTrending: TrendingItem[] };
  return (json.recentlyTrending ?? []).sort((a, b) => b.repoData.likes - a.repoData.likes);
}

export async function fetchHFModels(limit = 20): Promise<HFModel[]> {
  const items = await fetchTrending('model', limit);
  return items.map(({ repoData }) => ({
    id: repoData.id,
    author: repoData.author,
    likes: repoData.likes,
    downloads: repoData.downloads,
    pipeline_tag: repoData.pipeline_tag,
    lastModified: repoData.lastModified,
  }));
}

export async function fetchHFDatasets(limit = 20): Promise<HFDataset[]> {
  const items = await fetchTrending('dataset', limit);
  return items.map(({ repoData }) => ({
    id: repoData.id,
    author: repoData.author,
    likes: repoData.likes,
    downloads: repoData.downloads,
    lastModified: repoData.lastModified,
  }));
}
