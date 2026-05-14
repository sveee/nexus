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

interface RedditChild {
  data: {
    id: string;
    title: string;
    url: string;
    score: number;
    num_comments: number;
    author: string;
    thumbnail: string;
    permalink: string;
    created_utc: number;
    subreddit: string;
  };
}

interface RedditApiResponse {
  data: { children: RedditChild[] };
}

export async function fetchSubredditPosts(
  subreddit: string,
  limit = 25
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=${limit}&raw_json=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'nexus-ml-dashboard/1.0 by ml-researcher' },
  });

  if (!res.ok) throw new Error(`Reddit responded ${res.status}`);

  const json = (await res.json()) as RedditApiResponse;
  return (json.data?.children ?? []).map(({ data: d }) => ({
    id: d.id,
    title: d.title,
    url: d.url,
    score: d.score,
    num_comments: d.num_comments,
    author: d.author,
    thumbnail: d.thumbnail?.startsWith('http') ? d.thumbnail : undefined,
    permalink: `https://www.reddit.com${d.permalink}`,
    created_utc: d.created_utc,
    subreddit: d.subreddit,
  }));
}
