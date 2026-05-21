import * as cheerio from 'cheerio';

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

export interface AAModel {
  rank: number;
  name: string;
  provider: string;
  slug: string;
  intelligenceIndex: number | null;
  codingIndex: number | null;
  agenticIndex: number | null;
  priceInput: number | null;   // per 1M input tokens
  priceOutput: number | null;  // per 1M output tokens
  outputSpeed: number | null;  // tokens/sec
  contextWindow: string;
  isOpenWeights: boolean;
  releaseDate: string | null;
}

export interface CombinedModel {
  rank: number;
  name: string;
  provider: string;
  meanScore: number;        // 0–100 mean of normalized scores
  sourceCount: number;      // how many benchmarks contributed
  url?: string;
  scores: {
    aa?: number;            // normalized AA intelligence index
    llmStats?: number;      // normalized LLM Stats overall
    arena?: number;         // normalized Arena rank → score
    cursor?: number;        // normalized Cursor score
  };
}

export interface BenchmarksData {
  llmStats: LLMStatsModel[];
  arena: ArenaModel[];
  cursor: CursorEval[];
  aa: AAModel[];
  combined: CombinedModel[];
}

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(/,/g, '').replace(/\$/g, '').replace(/%/g, '').trim());
  return isNaN(n) ? null : n;
}

function dash(s: string): string | null {
  return (s === '—' || s === '-' || s === '') ? null : s.trim();
}

// ─── llm-stats.com ──────────────────────────────────────────────────────────
// Table columns: [0] rank | [1] name+provider+logo | [2] ZeroEval | [3] MMLU-Pro
//                [4] Coding | [5] Math | [6] ContextK | [7] ? | [8] Speed | [9] Price | [10] License

export async function fetchLLMStats(limit = 25): Promise<LLMStatsModel[]> {
  const res = await fetch('https://llm-stats.com/', {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
  });
  if (!res.ok) throw new Error(`llm-stats responded ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const models: LLMStatsModel[] = [];

  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 8) return;

    const rank = parseInt(cells.eq(0).text().trim(), 10);
    if (isNaN(rank) || rank > limit) return;

    const nameCell = cells.eq(1);
    const provider = nameCell.find('img').attr('alt') ?? 'Unknown';
    const nameLink = nameCell.find('a').first();
    const name = nameLink.text().trim();
    const href = nameLink.attr('href') ?? '';
    const isUnreleased = /UNRELEASED/i.test(nameCell.text());

    const toNum = (i: number) => {
      const t = dash(cells.eq(i).text().trim());
      return t ? parseNum(t) : null;
    };

    models.push({
      rank,
      name,
      provider,
      url: href ? `https://llm-stats.com${href}` : '',
      overallScore: toNum(2),
      mmluPro:      toNum(3),
      codingScore:  toNum(4),
      mathScore:    toNum(5),
      contextK:     dash(cells.eq(6).text().trim()),
      speed:        dash(cells.eq(8).text().trim()),
      pricePerM:    dash(cells.eq(9).text().trim()),
      license:      dash(cells.eq(10).text().trim()),
      isUnreleased,
    });

    if (models.length >= limit) return false;
  });

  return models;
}

// ─── arena.ai/leaderboard ───────────────────────────────────────────────────
// Main leaderboard table (9 columns):
//   [0] Model (provider+name concat) | [1] Overall | [2] Expert | [3] Hard Prompts
//   [4] Coding | [5] Math | [6] Creative Writing | [7] Instruction Following | [8] Longer Query

const KNOWN_PROVIDERS = [
  'Anthropic', 'OpenAI', 'Google', 'Meta', 'Bytedance', 'Tencent',
  'DeepSeek', 'xAI', 'Mistral', 'Amazon', 'Alibaba', 'Stepfun',
  'NVIDIA', 'Kimi', 'MiniMax', 'Xiaomi', 'Moonshot', 'Baidu',
];

function splitProviderName(combined: string): [string | null, string] {
  for (const p of KNOWN_PROVIDERS) {
    if (combined.startsWith(p)) {
      return [p, combined.slice(p.length).trim()];
    }
  }
  return [null, combined];
}

export async function fetchArenaLeaderboard(limit = 30): Promise<ArenaModel[]> {
  const res = await fetch('https://arena.ai/leaderboard', {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
  });
  if (!res.ok) throw new Error(`arena.ai responded ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const models: ArenaModel[] = [];

  // Find the full leaderboard table: it has 9 columns (Model + 8 rank categories)
  $('table').each((_, tbl) => {
    if (models.length > 0) return false; // already found

    const headers = $(tbl).find('th');
    if (headers.length < 7) return; // skip small tables

    $(tbl).find('tbody tr').each((_, row) => {
      if (models.length >= limit) return false;

      const cells = $(row).find('td');
      if (cells.length < 5) return;

      const rawName = cells.eq(0).text().trim().replace(/\s+/g, '');
      const [provider, name] = splitProviderName(rawName);

      const toRank = (i: number) => {
        const t = cells.eq(i).text().trim();
        if (t === '\\-' || t === '—' || t === '') return null;
        const n = parseInt(t, 10);
        return isNaN(n) ? null : n;
      };

      const overall = toRank(1);
      if (!name || overall === null) return;

      models.push({
        rank: overall,
        name,
        provider,
        hard:        toRank(3),
        coding:      toRank(4),
        math:        toRank(5),
        instruction: toRank(7),
      });
    });
  });

  return models.sort((a, b) => a.rank - b.rank);
}

// ─── cursor.com/evals ───────────────────────────────────────────────────────
// Table columns: [0] rank | [1] name | [2] score% | [3] avg cost

export async function fetchCursorEvals(): Promise<CursorEval[]> {
  const res = await fetch('https://cursor.com/evals', {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`cursor.com/evals responded ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const evals: CursorEval[] = [];
  const seen = new Set<number>();

  // Take only the first matching table (the page has 2 identical tables)
  $('table').first().find('tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 3) return;

    const rank = parseInt(cells.eq(0).text().trim(), 10);
    if (isNaN(rank) || seen.has(rank)) return;
    seen.add(rank);

    const name = cells.eq(1).text().trim();
    const score = parseNum(cells.eq(2).text());
    const cost = parseNum(cells.eq(3).text());

    if (name && score !== null) {
      evals.push({ rank, name, score, avgCost: cost ?? 0 });
    }
  });

  return evals;
}

// ─── artificialanalysis.ai ───────────────────────────────────────────────────
// Data fetched via Next.js RSC (React Server Components) payload, which embeds
// the full defaultData array containing 500+ model objects with all benchmark fields.

function extractJsonArray(s: string, startIdx: number): string | null {
  let depth = 0;
  let i = startIdx;
  while (i < s.length) {
    if (s[i] === '[') depth++;
    else if (s[i] === ']') {
      depth--;
      if (depth === 0) return s.slice(startIdx, i + 1);
    }
    i++;
  }
  return null;
}

export async function fetchAA(limit = 30): Promise<AAModel[]> {
  const res = await fetch('https://artificialanalysis.ai/models', {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,*/*',
      RSC: '1',
      'Next-Router-State-Tree':
        '%5B%22%22%2C%7B%22children%22%3A%5B%22(pages)%22%2C%7B%22children%22%3A%5B%22models%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%5D%7D%5D',
    },
  });
  if (!res.ok) throw new Error(`artificialanalysis.ai responded ${res.status}`);

  const text = await res.text();
  const markerKey = '"defaultData":[{';
  const markerIdx = text.indexOf(markerKey);
  if (markerIdx === -1) throw new Error('AA: defaultData not found in RSC payload');

  const arrStr = extractJsonArray(text, markerIdx + '"defaultData":'.length);
  if (!arrStr) throw new Error('AA: failed to extract defaultData array');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any[] = JSON.parse(arrStr);

  const models: AAModel[] = raw
    .filter(
      (m) =>
        !m.deleted &&
        !m.deprecated &&
        m.intelligence_index != null,
    )
    .sort((a, b) => (b.intelligence_index ?? 0) - (a.intelligence_index ?? 0))
    .slice(0, limit)
    .map((m, i) => ({
      rank: i + 1,
      name: m.name ?? m.short_name ?? 'Unknown',
      provider: m.model_creators?.name ?? 'Unknown',
      slug: m.slug ?? '',
      intelligenceIndex: m.intelligence_index ?? null,
      codingIndex: m.coding_index ?? null,
      agenticIndex: m.agentic_index ?? null,
      priceInput: m.price_1m_input_tokens ?? null,
      priceOutput: m.price_1m_output_tokens ?? null,
      outputSpeed: m.timescaleData?.median_output_speed ?? null,
      contextWindow: m.contextWindowFormatted ?? '',
      isOpenWeights: !!m.is_open_weights,
      releaseDate: m.release_date ?? null,
    }));

  return models;
}

// ─── Combined ranking ────────────────────────────────────────────────────────
// Normalizes each source to 0–100 via min-max, matches models across sources
// by canonical name (strip variant suffixes, lowercase, alphanumeric only),
// then ranks by mean of available normalized scores.

function minMax(values: number[], v: number): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 50;
  return ((v - min) / (max - min)) * 100;
}

// "GPT-5.5 (xhigh)" → "gpt55", "Claude Opus 4.7 (max)" → "claudeopus47"
function canon(name: string): string {
  return name
    .replace(/\s*\([^)]*\)/g, '')  // strip (variant) suffixes
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}

function computeCombined(
  aa: AAModel[],
  llmStats: LLMStatsModel[],
  arena: ArenaModel[],
  cursor: CursorEval[],
): CombinedModel[] {
  // Pre-compute min-max normalized values per source
  const aaScores   = aa.map(m => m.intelligenceIndex).filter((v): v is number => v !== null);
  const llmScores  = llmStats.map(m => m.overallScore).filter((v): v is number => v !== null);
  const arenaRanks = arena.map(m => m.rank);
  const curScores  = cursor.map(e => e.score).filter(v => v !== null);

  const aaMap     = new Map(aa.map(m => [canon(m.name), m]));
  const llmMap    = new Map(llmStats.map(m => [canon(m.name), m]));
  const arenaMap  = new Map(arena.map(m => [canon(m.name), m]));
  const cursorMap = new Map(cursor.map(e => [canon(e.name), e]));

  // Collect all unique canonical names, preferring AA as primary
  const allCanons = new Set([
    ...aaMap.keys(),
    ...llmMap.keys(),
    ...arenaMap.keys(),
    ...cursorMap.keys(),
  ]);

  const rows: CombinedModel[] = [];

  for (const key of allCanons) {
    const aaM    = aaMap.get(key);
    const llmM   = llmMap.get(key);
    const arenaM = arenaMap.get(key);
    const curM   = cursorMap.get(key);

    // Require at least 1 source
    const normAA     = (aaM?.intelligenceIndex != null && aaScores.length > 0)
                         ? minMax(aaScores, aaM.intelligenceIndex) : undefined;
    const normLLM    = (llmM?.overallScore != null && llmScores.length > 0)
                         ? minMax(llmScores, llmM.overallScore) : undefined;
    const normArena  = (arenaM && arenaRanks.length > 0)
                         // invert rank: rank 1 = best = 100
                         ? minMax(arenaRanks.map(r => -r), -arenaM.rank) : undefined;
    const normCursor = (curM && curScores.length > 0)
                         ? minMax(curScores, curM.score) : undefined;

    const available = [normAA, normLLM, normArena, normCursor].filter((v): v is number => v !== undefined);
    if (available.length === 0) continue;

    const meanScore = available.reduce((a, b) => a + b, 0) / available.length;
    const primary   = aaM ?? llmM ?? arenaM ?? curM!;

    rows.push({
      rank: 0,
      name: 'name' in primary ? primary.name : (primary as CursorEval).name,
      provider: ('provider' in primary && primary.provider) ? (primary.provider as string) : '',
      meanScore,
      sourceCount: available.length,
      url: aaM ? `https://artificialanalysis.ai/models/${aaM.slug}` : llmM?.url,
      scores: {
        aa:       normAA,
        llmStats: normLLM,
        arena:    normArena,
        cursor:   normCursor,
      },
    });
  }

  return rows
    .sort((a, b) => b.meanScore - a.meanScore)
    .map((m, i) => ({ ...m, rank: i + 1 }));
}

// ─── Main export ────────────────────────────────────────────────────────────

export async function fetchBenchmarks(): Promise<BenchmarksData> {
  const [llmStats, arena, cursor, aa] = await Promise.allSettled([
    fetchLLMStats(25),
    fetchArenaLeaderboard(30),
    fetchCursorEvals(),
    fetchAA(30),
  ]);

  const llmStatsData = llmStats.status === 'fulfilled' ? llmStats.value : [];
  const arenaData    = arena.status === 'fulfilled' ? arena.value : [];
  const cursorData   = cursor.status === 'fulfilled' ? cursor.value : [];
  const aaData       = aa.status === 'fulfilled' ? aa.value : [];

  return {
    llmStats: llmStatsData,
    arena:    arenaData,
    cursor:   cursorData,
    aa:       aaData,
    combined: computeCombined(aaData, llmStatsData, arenaData, cursorData),
  };
}
