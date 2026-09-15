import * as cheerio from 'cheerio';

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

const NITTER_INSTANCES = [
  'https://nitter.cf',
  'https://nitter.net',
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
];

async function tryFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(tid);
  }
}

export async function fetchKarpathyTweets(limit = 20): Promise<KarpathyTweet[]> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await tryFetch(`${instance}/karpathy/rss`);
      if (!res.ok) continue;
      const xml = await res.text();
      const tweets = parseRSS(xml);
      if (tweets.length > 0) return tweets.slice(0, limit);
    } catch {
      continue;
    }
  }
  throw new Error('All Nitter instances unavailable — try again later');
}

function parseRSS(xml: string): KarpathyTweet[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const tweets: KarpathyTweet[] = [];

  $('item').each((_, el) => {
    const $el = $(el);

    // Link is a text node inside <link>; guid has the numeric tweet ID
    const link = $el.find('link').text().trim() || $el.find('guid').text().trim();
    const pubDate = $el.find('pubDate').text().trim();
    const rawDescription = $el.find('description').text().trim();

    // Extract numeric ID and build x.com URL
    const idMatch = link.match(/\/status\/(\d+)/);
    if (!idMatch) return;
    const id = idMatch[1]!;
    const twitterUrl = `https://x.com/karpathy/status/${id}`;
    const timestamp = pubDate ? new Date(pubDate).getTime() : 0;

    // Parse description HTML
    const $d = cheerio.load(rawDescription);

    // Check for quote tweet: presence of <hr/> separating tweet from blockquote
    const hasHr = $d('hr').length > 0;
    const hasBlockquote = $d('blockquote').length > 0;

    let isRetweet = false;
    let isQuote = false;
    let quotedAuthor: string | undefined;
    let text: string;

    if (hasBlockquote && !hasHr) {
      // Pure retweet — the entire content is someone else's quote
      isRetweet = true;
      quotedAuthor = $d('blockquote b').first().text().trim() || undefined;
      $d('blockquote').remove();
      text = $d.text().trim().replace(/\s+/g, ' ');
    } else if (hasHr && hasBlockquote) {
      // Quote tweet — Karpathy's text comes before the <hr/>
      isQuote = true;
      quotedAuthor = $d('blockquote b').first().text().trim() || undefined;
      // Remove everything after (and including) hr
      $d('hr').nextAll().remove();
      $d('hr').remove();
      $d('blockquote').remove();
      text = $d.text().trim().replace(/\s+/g, ' ');
    } else {
      // Original tweet
      $d('img').remove();
      text = $d.text().trim().replace(/\s+/g, ' ');
    }

    if (!text) return;

    tweets.push({ id, text, url: twitterUrl, pubDate, timestamp, isRetweet, isQuote, quotedAuthor });
  });

  return tweets;
}
