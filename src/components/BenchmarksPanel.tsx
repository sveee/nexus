import { useState } from 'react';
import { ExternalLink, BarChart2, Code2, Trophy, Zap, Brain, Layers } from 'lucide-react';
import type { DataState } from '../hooks/useData';
import type { BenchmarksData, LLMStatsModel, ArenaModel, CursorEval, AAModel, CombinedModel } from '../types';
import { Panel } from './shared';

interface Props {
  state: DataState<BenchmarksData>;
  onRefresh: () => void;
}

type SubTab = 'combined' | 'aa' | 'llmstats' | 'arena' | 'cursor';

// ── helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number | null, max = 100): string {
  if (score === null) return 'var(--text-3)';
  const pct = score / max;
  if (pct >= 0.7) return 'var(--emerald)';
  if (pct >= 0.5) return 'var(--sky)';
  if (pct >= 0.3) return 'var(--amber)';
  return 'var(--rose)';
}

function rankBadge(rank: number) {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  if (medals[rank]) {
    return <span style={{ fontSize: 14 }}>{medals[rank]}</span>;
  }
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-3)',
      minWidth: 20,
      display: 'inline-block',
      textAlign: 'right',
    }}>{rank}</span>
  );
}

function ScorePill({ value, max = 100, suffix = '' }: { value: number | null; max?: number; suffix?: string }) {
  if (value === null) return <span style={{ color: 'var(--text-3)', fontSize: 11 }}>—</span>;
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      color: scoreColor(value, max),
    }}>
      {value.toFixed(1)}{suffix}
    </span>
  );
}

function RankCell({ rank, maxRank = 30 }: { rank: number | null; maxRank?: number }) {
  if (rank === null) return <span style={{ color: 'var(--text-3)', fontSize: 11 }}>—</span>;
  const pct = 1 - (rank - 1) / maxRank;
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: pct >= 0.8 ? 'var(--emerald)' : pct >= 0.5 ? 'var(--sky)' : 'var(--text-3)',
    }}>
      #{rank}
    </span>
  );
}

// ── sub-tabs ─────────────────────────────────────────────────────────────────

// Source dot with tooltip
function SourceDot({ label, value, color }: { label: string; value?: number; color: string }) {
  const active = value !== undefined;
  return (
    <div title={active ? `${label}: ${value!.toFixed(0)}` : `${label}: not in this benchmark`}
      style={{
        width: 8, height: 8, borderRadius: '50%',
        background: active ? color : 'var(--border)',
        flexShrink: 0,
        cursor: 'default',
      }}
    />
  );
}

function CombinedRow({ m }: { m: CombinedModel }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 80px 36px',
        padding: '9px 16px',
        gap: 8,
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.12s',
        cursor: m.url ? 'pointer' : 'default',
      }}
      onClick={() => m.url && window.open(m.url, '_blank', 'noopener')}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>{rankBadge(m.rank)}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{m.name}</div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
          {m.provider && <span>{m.provider}</span>}
          <span>·</span>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }} title="Source coverage: AA / LLM Stats / Arena / Cursor">
            <SourceDot label="AA"        value={m.scores.aa}       color="var(--violet-b)" />
            <SourceDot label="LLM Stats" value={m.scores.llmStats} color="var(--sky)" />
            <SourceDot label="Arena"     value={m.scores.arena}    color="var(--amber)" />
            <SourceDot label="Cursor"    value={m.scores.cursor}   color="var(--emerald)" />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: 10 }}>
            {m.sourceCount} source{m.sourceCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
        <div style={{ width: 44, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${m.meanScore}%`,
            background: scoreColor(m.meanScore, 100),
            borderRadius: 2, transition: 'width 0.3s',
          }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
          color: scoreColor(m.meanScore, 100), minWidth: 32, textAlign: 'right',
        }}>{m.meanScore.toFixed(0)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {m.url && <ExternalLink size={11} style={{ color: 'var(--text-3)', opacity: 0.5 }} />}
      </div>
    </div>
  );
}

function CombinedTab({ models }: { models: CombinedModel[] }) {
  if (models.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Combined data not available.
      </div>
    );
  }

  const multi  = models.filter(m => m.sourceCount >= 2);
  const single = models.filter(m => m.sourceCount === 1);

  return (
    <div>
      <div style={{
        padding: '6px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
      }}>
        <Layers size={10} />
        Mean of min-max normalized scores across all available benchmarks
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {([['var(--violet-b)', 'AA'], ['var(--sky)', 'LLM Stats'], ['var(--amber)', 'Arena'], ['var(--emerald)', 'Cursor']] as const).map(([color, label]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 80px 36px',
        padding: '5px 16px',
        gap: 8,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'var(--surface)',
        zIndex: 1,
      }}>
        <span>#</span>
        <span>MODEL</span>
        <span style={{ textAlign: 'right' }}>MEAN SCORE</span>
        <span />
      </div>

      {multi.length > 0 && (
        <>
          <div style={{
            padding: '4px 16px', fontSize: 10, fontFamily: 'var(--font-mono)',
            color: 'var(--text-3)', background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)', letterSpacing: '0.06em',
          }}>
            ✦ MULTI-SOURCE — {multi.length} models found in ≥2 benchmarks
          </div>
          {multi.map(m => <CombinedRow key={m.name} m={m} />)}
        </>
      )}

      {single.length > 0 && (
        <>
          <div style={{
            padding: '4px 16px', fontSize: 10, fontFamily: 'var(--font-mono)',
            color: 'var(--text-3)', background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)', letterSpacing: '0.06em',
          }}>
            SINGLE-SOURCE — {single.length} models in only 1 benchmark
          </div>
          {single.map(m => <CombinedRow key={m.name} m={m} />)}
        </>
      )}
    </div>
  );
}

function AATab({ models }: { models: AAModel[] }) {
  if (models.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Could not load Artificial Analysis data.
        <div style={{ marginTop: 8, fontSize: 11 }}>
          <a href="https://artificialanalysis.ai/models" target="_blank" rel="noreferrer"
            style={{ color: 'var(--sky)', textDecoration: 'none' }}>
            Visit artificialanalysis.ai ↗
          </a>
        </div>
      </div>
    );
  }

  const maxIntel = Math.max(...models.map(m => m.intelligenceIndex ?? 0));

  return (
    <div>
      <div style={{
        padding: '6px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
      }}>
        <Brain size={10} />
        Source: artificialanalysis.ai · Intelligence, Coding &amp; Agentic Indices
        <a href="https://artificialanalysis.ai/models" target="_blank" rel="noreferrer"
          style={{ color: 'var(--sky)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
          open <ExternalLink size={9} />
        </a>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 70px 62px 62px 62px 70px 60px',
        padding: '5px 16px',
        gap: 8,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'var(--surface)',
        zIndex: 1,
      }}>
        <span>#</span>
        <span>MODEL</span>
        <span style={{ textAlign: 'right' }}>INTEL</span>
        <span style={{ textAlign: 'right' }}>CODE</span>
        <span style={{ textAlign: 'right' }}>AGENT</span>
        <span style={{ textAlign: 'right' }}>SPEED</span>
        <span style={{ textAlign: 'right' }}>PRICE/M</span>
        <span style={{ textAlign: 'center' }}>CTX</span>
      </div>

      {models.map((m) => {
        const url = `https://artificialanalysis.ai/models/${m.slug}`;
        return (
          <div
            key={m.slug || m.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 70px 62px 62px 62px 70px 60px',
              padding: '9px 16px',
              gap: 8,
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              transition: 'background 0.12s',
              cursor: 'pointer',
            }}
            onClick={() => window.open(url, '_blank', 'noopener')}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>{rankBadge(m.rank)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                {m.name}
                {m.isOpenWeights && (
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--emerald)',
                    background: 'rgba(52,211,153,0.12)',
                    padding: '1px 4px',
                    borderRadius: 3,
                    flexShrink: 0,
                  }}>OSS</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{m.provider}</div>
            </div>
            {/* Intelligence index with bar */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                <div style={{ width: 30, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${((m.intelligenceIndex ?? 0) / maxIntel) * 100}%`,
                    background: scoreColor(m.intelligenceIndex, maxIntel),
                    borderRadius: 2,
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: scoreColor(m.intelligenceIndex, maxIntel),
                }}>
                  {m.intelligenceIndex != null ? m.intelligenceIndex.toFixed(1) : '—'}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <ScorePill value={m.codingIndex} max={maxIntel} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <ScorePill value={m.agenticIndex} max={maxIntel} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
              {m.outputSpeed != null ? `${Math.round(m.outputSpeed)}t/s` : '—'}
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
              {m.priceOutput != null ? `$${m.priceOutput.toFixed(2)}` : '—'}
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
              {m.contextWindow || '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LLMStatsTab({ models }: { models: LLMStatsModel[] }) {
  if (models.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Could not load llm-stats data.
        <div style={{ marginTop: 8, fontSize: 11 }}>
          <a href="https://llm-stats.com" target="_blank" rel="noreferrer"
            style={{ color: 'var(--sky)', textDecoration: 'none' }}>
            Visit llm-stats.com ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Attribution */}
      <div style={{
        padding: '6px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
      }}>
        <BarChart2 size={10} />
        Source: llm-stats.com · ZeroEval aggregate benchmark
        <a href="https://llm-stats.com" target="_blank" rel="noreferrer"
          style={{ color: 'var(--sky)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
          open <ExternalLink size={9} />
        </a>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 80px 60px 60px 70px 70px',
        padding: '5px 16px',
        gap: 8,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'var(--surface)',
        zIndex: 1,
      }}>
        <span>#</span>
        <span>MODEL</span>
        <span style={{ textAlign: 'right' }}>SCORE</span>
        <span style={{ textAlign: 'right' }}>MMLU</span>
        <span style={{ textAlign: 'right' }}>CODE</span>
        <span style={{ textAlign: 'right' }}>SPEED</span>
        <span style={{ textAlign: 'right' }}>PRICE/M</span>
      </div>

      {models.map((m) => (
        <div
          key={`${m.rank}-${m.name}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 80px 60px 60px 70px 70px',
            padding: '9px 16px',
            gap: 8,
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            transition: 'background 0.12s',
            cursor: m.url ? 'pointer' : 'default',
          }}
          onClick={() => m.url && window.open(m.url, '_blank', 'noopener')}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>{rankBadge(m.rank)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              {m.name}
              {m.isUnreleased && (
                <span style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--amber)',
                  background: 'rgba(251,191,36,0.12)',
                  padding: '1px 4px',
                  borderRadius: 3,
                  flexShrink: 0,
                }}>UNRELEASED</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
              {m.provider}
              {m.license && (
                <span style={{ marginLeft: 6, color: m.license === 'Open Source' ? 'var(--emerald)' : 'var(--text-3)' }}>
                  · {m.license === 'Open Source' ? '🔓 open' : '🔒 proprietary'}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}><ScorePill value={m.overallScore} /></div>
          <div style={{ textAlign: 'right' }}><ScorePill value={m.mmluPro} /></div>
          <div style={{ textAlign: 'right' }}><ScorePill value={m.codingScore} /></div>
          <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
            {m.speed ?? '—'}
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
            {m.pricePerM ?? '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArenaTab({ models }: { models: ArenaModel[] }) {
  if (models.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Could not load Arena data.
        <div style={{ marginTop: 8, fontSize: 11 }}>
          <a href="https://arena.ai/leaderboard" target="_blank" rel="noreferrer"
            style={{ color: 'var(--sky)', textDecoration: 'none' }}>
            Visit arena.ai/leaderboard ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        padding: '6px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
      }}>
        <Trophy size={10} />
        Source: arena.ai · Human preference rankings by category
        <a href="https://arena.ai/leaderboard" target="_blank" rel="noreferrer"
          style={{ color: 'var(--sky)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
          open <ExternalLink size={9} />
        </a>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 70px 70px 70px 70px',
        padding: '5px 16px',
        gap: 8,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'var(--surface)',
        zIndex: 1,
      }}>
        <span>RANK</span>
        <span>MODEL</span>
        <span style={{ textAlign: 'center' }}>CODING</span>
        <span style={{ textAlign: 'center' }}>MATH</span>
        <span style={{ textAlign: 'center' }}>HARD</span>
        <span style={{ textAlign: 'center' }}>IF</span>
      </div>

      {models.map((m) => (
        <div
          key={`${m.rank}-${m.name}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 70px 70px 70px 70px',
            padding: '9px 16px',
            gap: 8,
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>{rankBadge(m.rank)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {m.name}
            </div>
            {m.provider && (
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{m.provider}</div>
            )}
          </div>
          <div style={{ textAlign: 'center' }}><RankCell rank={m.coding} maxRank={models.length} /></div>
          <div style={{ textAlign: 'center' }}><RankCell rank={m.math} maxRank={models.length} /></div>
          <div style={{ textAlign: 'center' }}><RankCell rank={m.hard} maxRank={models.length} /></div>
          <div style={{ textAlign: 'center' }}><RankCell rank={m.instruction} maxRank={models.length} /></div>
        </div>
      ))}
    </div>
  );
}

function CursorTab({ evals }: { evals: CursorEval[] }) {
  if (evals.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Could not load Cursor Evals data.
        <div style={{ marginTop: 8, fontSize: 11 }}>
          <a href="https://cursor.com/evals" target="_blank" rel="noreferrer"
            style={{ color: 'var(--sky)', textDecoration: 'none' }}>
            Visit cursor.com/evals ↗
          </a>
        </div>
      </div>
    );
  }

  const maxScore = Math.max(...evals.map(e => e.score));
  const maxCost = Math.max(...evals.map(e => e.avgCost));

  return (
    <div>
      <div style={{
        padding: '6px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
      }}>
        <Code2 size={10} />
        Source: cursor.com/evals · CursorBench 3.1 — multi-file coding tasks
        <a href="https://cursor.com/evals" target="_blank" rel="noreferrer"
          style={{ color: 'var(--sky)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
          open <ExternalLink size={9} />
        </a>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 120px 110px',
        padding: '5px 16px',
        gap: 8,
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'var(--surface)',
        zIndex: 1,
      }}>
        <span>#</span>
        <span>MODEL</span>
        <span style={{ textAlign: 'right' }}>SCORE</span>
        <span style={{ textAlign: 'right' }}>AVG COST/TASK</span>
      </div>

      {evals.map((e) => (
        <div
          key={`${e.rank}-${e.name}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 120px 110px',
            padding: '9px 16px',
            gap: 8,
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            transition: 'background 0.12s',
          }}
          onMouseEnter={el => { (el.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
          onMouseLeave={el => { (el.currentTarget as HTMLElement).style.background = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>{rankBadge(e.rank)}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{e.name}</div>
          <div style={{ textAlign: 'right' }}>
            {/* Score bar + value */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <div style={{ width: 50, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(e.score / maxScore) * 100}%`,
                  background: scoreColor(e.score, maxScore),
                  borderRadius: 2,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                color: scoreColor(e.score, maxScore),
              }}>{e.score.toFixed(1)}%</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <Zap size={10} style={{ color: e.avgCost > maxCost * 0.5 ? 'var(--amber)' : 'var(--emerald)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: e.avgCost > maxCost * 0.5 ? 'var(--amber)' : e.avgCost < 1 ? 'var(--emerald)' : 'var(--text-2)',
              }}>
                {e.avgCost > 0 ? `$${e.avgCost.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>
        </div>
      ))}

      <div style={{
        padding: '8px 16px',
        fontSize: 10,
        color: 'var(--text-3)',
        borderTop: '1px solid var(--border)',
        fontStyle: 'italic',
      }}>
        Cost calculated from published token pricing applied to actual tokens used per task.
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

const SUB_TABS: { id: SubTab; label: string; icon: typeof BarChart2 }[] = [
  { id: 'combined', label: 'Combined',      icon: Layers },
  { id: 'aa',       label: 'AA',            icon: Brain },
  { id: 'llmstats', label: 'LLM Stats',     icon: BarChart2 },
  { id: 'arena',    label: 'Arena',         icon: Trophy },
  { id: 'cursor',   label: 'Cursor Evals',  icon: Code2 },
];

export default function BenchmarksPanel({ state }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('combined');

  return (
    <Panel
      state={state}
      title="Benchmarks"
      meta="RANKINGS · SCORES · COST"
      accentClass="badge-orange"
      skeletonCols={[5, 45, 15, 15, 12]}
    >
      {(data) => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Sub-tab bar */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '0 12px',
            gap: 2,
            flexShrink: 0,
          }}>
            {SUB_TABS.map(({ id, label, icon: Icon }) => {
              const isActive = subTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setSubTab(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 10px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'var(--font-body)',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--orange)' : 'var(--text-3)',
                    borderBottom: `2px solid ${isActive ? 'var(--orange)' : 'transparent'}`,
                    marginBottom: -1,
                    transition: 'color 0.12s',
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {subTab === 'combined' && <CombinedTab models={data.combined ?? []} />}
            {subTab === 'aa'       && <AATab models={data.aa ?? []} />}
            {subTab === 'llmstats' && <LLMStatsTab models={data.llmStats} />}
            {subTab === 'arena'    && <ArenaTab models={data.arena} />}
            {subTab === 'cursor'   && <CursorTab evals={data.cursor} />}
          </div>
        </div>
      )}
    </Panel>
  );
}
