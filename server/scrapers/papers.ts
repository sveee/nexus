import * as cheerio from 'cheerio';

export interface Paper {
  title: string;
  url: string;
  likes: number;
  date: string;
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function fetchPapers(
  since: 'daily' | 'weekly' | 'monthly' = 'weekly',
  topN = 25
): Promise<Paper[]> {
  const now = new Date();
  let suffix: string;
  let dateStr: string;

  switch (since) {
    case 'daily':
      dateStr = now.toISOString().split('T')[0]!;
      suffix = `date/${dateStr}`;
      break;
    case 'weekly': {
      const year = now.getFullYear();
      const week = getISOWeek(now);
      dateStr = `${year}-W${String(week).padStart(2, '0')}`;
      suffix = `week/${dateStr}`;
      break;
    }
    case 'monthly':
      dateStr = now.toISOString().slice(0, 7);
      suffix = `month/${dateStr}`;
      break;
  }

  const url = `https://huggingface.co/papers/${suffix}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NexusDashboard/1.0)' },
  });

  if (!res.ok) throw new Error(`HF papers responded ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const papers: Paper[] = [];

  $('article').each((_, el) => {
    const titleLink = $(el).find('h3 a').first();
    const title = titleLink.text().trim();
    if (!title) return;

    let href = titleLink.attr('href') ?? '';
    if (href.startsWith('/')) href = `https://huggingface.co${href}`;

    let likes = 0;
    $(el).find('div.leading-none').each((_, d) => {
      if (likes) return;
      const n = parseInt($(d).text().trim(), 10);
      if (!isNaN(n)) likes = n;
    });

    papers.push({ title, url: href, likes, date: dateStr });
  });

  papers.sort((a, b) => b.likes - a.likes);
  return papers.slice(0, topN);
}
