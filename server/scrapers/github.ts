import * as cheerio from 'cheerio';

export interface Repo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  new_stars: number;
  language: string;
  url: string;
}

function parseNum(s: string): number {
  return parseInt(s.trim().replace(/,/g, ''), 10) || 0;
}

export async function fetchGitHubTrending(
  since: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<Repo[]> {
  const url = `https://github.com/trending?since=${since}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html',
    },
  });

  if (!res.ok) throw new Error(`GitHub trending responded ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const repos: Repo[] = [];

  $('article.Box-row').each((_, el) => {
    const $el = $(el);
    const href = $el.find('h2 a').first().attr('href') ?? '';
    if (!href) return;

    const name = href.replace(/^\//, '');
    const repoURL = `https://github.com/${name}`;
    const description = $el.find('p.col-9').text().trim();
    const lang = $el.find('[itemprop="programmingLanguage"]').text().trim();
    const muted = $el.find('a.Link--muted');
    const stars = parseNum(muted.eq(0).text());
    const forks = parseNum(muted.eq(1).text());
    const newStarsRaw = $el.find('.float-sm-right').text().trim().split(/\s+/)[0] ?? '';
    const new_stars = parseNum(newStarsRaw);

    repos.push({ name, description, stars, forks, new_stars, language: lang, url: repoURL });
  });

  return repos;
}
