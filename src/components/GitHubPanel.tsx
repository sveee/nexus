import { useState } from 'react';
import type { DataState } from '../hooks/useData';
import type { GitHubRepo } from '../types';
import { Panel, formatNum, ShowMoreRow } from './shared';

interface Props {
  state: DataState<GitHubRepo[]>;
  onRefresh: () => void;
}

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Jupyter: '#DA5B0B',
  Shell: '#89e051',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Scala: '#c22d40',
  Haskell: '#5e5086',
};

function LangDot({ lang }: { lang: string }) {
  const color = LANG_COLORS[lang];
  if (!color) return <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{lang}</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{lang}</span>
    </div>
  );
}

export default function GitHubPanel({ state }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Panel
      state={state}
      title="GitHub"
      meta="TRENDING · WEEKLY"
      accentClass="badge-emerald"
      skeletonCols={[20, 38, 15, 10, 10]}
    >
      {(repos) => {
        const visible = expanded ? repos : repos.slice(0, 10);
        return (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 240 }}>Repository</th>
                <th>Description</th>
                <th style={{ width: 110 }}>Language</th>
                <th style={{ width: 80, textAlign: 'right' }}>Stars</th>
                <th style={{ width: 100, textAlign: 'right' }}>New ★</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.url} className="tbl-row" onClick={() => window.open(r.url, '_blank')}>
                  <td>
                    <span className="ext" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, display: 'block', wordBreak: 'break-word' }}>
                      {r.name}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-2)', fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.description || '—'}
                    </span>
                  </td>
                  <td>{r.language ? <LangDot lang={r.language} /> : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{formatNum(r.stars)}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {r.new_stars > 0
                      ? <span className="badge badge-emerald">+{formatNum(r.new_stars)}</span>
                      : <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
              <ShowMoreRow total={repos.length} showing={visible.length} expanded={expanded} onToggle={() => setExpanded(v => !v)} colSpan={5} />
            </tbody>
          </table>
        );
      }}
    </Panel>
  );
}

