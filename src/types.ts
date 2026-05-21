export type Section = 'papers' | 'models' | 'github' | 'datasets' | 'reddit' | 'karpathy' | 'benchmarks';

export interface KarpathyTweet {
  id: string;
  text: string;
  url: string;
  pubDate: string;
  timestamp: number;
  isRetweet: boolean;
  isQuote: boolean;
  quotedAuthor?: string;
}

export interface Paper {
  title: string;
  url: string;
  likes: number;
  date: string;
}

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

export interface GitHubRepo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  new_stars: number;
  language: string;
  url: string;
}

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  score: number;
  num_comments: number;
  author: string;
  thumbnail?: string;
  permalink: string;
  created_utc: number;
  subreddit: string;
}

export interface RedditData {
  LocalLLaMA: RedditPost[];
  LocalLLM: RedditPost[];
}

export interface LLMStatsModel {
  rank: number;
  name: string;
  provider: string;
  url: string;
  overallScore: number | null;
  mmluPro: number | null;
  codingScore: number | null;
  mathScore: number | null;
  contextK: string | null;
  speed: string | null;
  pricePerM: string | null;
  license: string | null;
  isUnreleased?: boolean;
}

export interface ArenaModel {
  rank: number;
  name: string;
  provider: string | null;
  coding: number | null;
  math: number | null;
  hard: number | null;
  instruction: number | null;
}

export interface CursorEval {
  rank: number;
  name: string;
  score: number;
  avgCost: number;
}

export interface BenchmarksData {
  llmStats: LLMStatsModel[];
  arena: ArenaModel[];
  cursor: CursorEval[];
}

export interface PaperSummary {
  ai_summary: string | null;
  ai_keywords: string[];
}

export interface ApiResult<T> {
  data: T;
  fetchedAt: number;
  isStale: boolean;
}
