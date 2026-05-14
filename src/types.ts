export type Section = 'papers' | 'models' | 'github' | 'datasets' | 'reddit' | 'karpathy';

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

export interface PaperSummary {
  ai_summary: string | null;
  ai_keywords: string[];
}

export interface ApiResult<T> {
  data: T;
  fetchedAt: number;
  isStale: boolean;
}
