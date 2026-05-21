import { useState, useEffect } from 'react';
import { RefreshCw, Menu } from 'lucide-react';
import type { Section } from './types';
import { api } from './api';
import { useData } from './hooks/useData';
import Sidebar from './components/Sidebar';
import PapersPanel from './components/PapersPanel';
import ModelsPanel from './components/ModelsPanel';
import GitHubPanel from './components/GitHubPanel';
import DatasetsPanel from './components/DatasetsPanel';
import RedditPanel from './components/RedditPanel';
import KarpathyPanel from './components/KarpathyPanel';
import BenchmarksPanel from './components/BenchmarksPanel';

function timeAgo(ts: number | null): string {
  if (!ts) return 'never';
  const d = Date.now() - ts;
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  return `${Math.floor(d / 3_600_000)}h ago`;
}

export default function App() {
  const [active, setActive] = useState<Section>('papers');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

  const papers     = useData(api.papers);
  const models     = useData(api.models);
  const github     = useData(api.github);
  const datasets   = useData(api.datasets);
  const reddit     = useData(api.reddit);
  const karpathy   = useData(api.karpathy);
  const benchmarks = useData(api.benchmarks);

  const all = { papers, models, github, datasets, reddit, karpathy, benchmarks };

  useEffect(() => {
    papers.refetch();
    models.refetch();
    github.refetch();
    datasets.refetch();
    reddit.refetch();
    karpathy.refetch();
    benchmarks.refetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = Object.values(all).some(d => d.loading);

  const oldestFetch = Object.values(all)
    .map(d => d.fetchedAt)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)[0] ?? null;

  function refreshAll() {
    papers.refetch(true);
    models.refetch(true);
    github.refetch(true);
    datasets.refetch(true);
    reddit.refetch(true);
    karpathy.refetch(true);
    benchmarks.refetch(true);
  }

  const ACCENT: Record<Section, string> = {
    benchmarks: 'var(--orange)',
    papers:   'var(--violet-b)',
    models:   'var(--sky)',
    github:   'var(--emerald)',
    datasets: 'var(--amber)',
    reddit:   'var(--rose)',
    karpathy: 'var(--fuchsia)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>

      {/* ── Header ── */}
      <header style={{
        height: 'var(--header-h)',
        flexShrink: 0,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 10,
      }}>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30,
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-3)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'color 0.13s, border-color 0.13s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
        >
          <Menu size={14} />
        </button>

        {/* Logo */}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 16,
          letterSpacing: '-0.02em',
          color: 'var(--text)',
          flexShrink: 0,
        }}>
          nexus
        </span>

        {/* Active section accent strip */}
        <div style={{
          height: 20, width: 2, borderRadius: 2,
          background: ACCENT[active], opacity: 0.7,
          transition: 'background 0.3s ease',
        }} />

        <div style={{ flex: 1 }} />

        {/* Status — hide label on small screens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-3)' }}>
          <div
            className={isLoading ? 'pulse' : ''}
            style={{ width: 6, height: 6, borderRadius: '50%', background: isLoading ? 'var(--emerald)' : 'var(--text-3)' }}
          />
          <span className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {isLoading ? 'fetching…' : `updated ${timeAgo(oldestFetch)}`}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={refreshAll}
          disabled={isLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 11px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: isLoading ? 'var(--text-3)' : 'var(--text-2)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            transition: 'border-color 0.13s, color 0.13s',
          }}
          onMouseEnter={e => {
            if (!isLoading) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.5)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)';
          }}
        >
          <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
          <span className="hide-mobile">Refresh all</span>
        </button>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'none',
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 55,
            }}
            className="mobile-backdrop"
          />
        )}

        <Sidebar
          active={active}
          onSelect={(s) => { setActive(s); if (window.innerWidth < 768) setSidebarOpen(false); }}
          states={all}
          open={sidebarOpen}
        />

        <main style={{ flex: 1, overflow: 'hidden' }}>
          {active === 'papers'     && <PapersPanel     state={papers}     onRefresh={() => papers.refetch(true)} />}
          {active === 'models'     && <ModelsPanel     state={models}     onRefresh={() => models.refetch(true)} />}
          {active === 'github'     && <GitHubPanel     state={github}     onRefresh={() => github.refetch(true)} />}
          {active === 'datasets'   && <DatasetsPanel   state={datasets}   onRefresh={() => datasets.refetch(true)} />}
          {active === 'reddit'     && <RedditPanel     state={reddit}     onRefresh={() => reddit.refetch(true)} />}
          {active === 'karpathy'   && <KarpathyPanel   state={karpathy}   onRefresh={() => karpathy.refetch(true)} />}
          {active === 'benchmarks' && <BenchmarksPanel state={benchmarks} onRefresh={() => benchmarks.refetch(true)} />}
        </main>
      </div>
    </div>
  );
}
