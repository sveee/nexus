import type { ReactNode } from 'react';
import type { DataState } from '../hooks/useData';

export function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function timeAgo(utcSeconds: number): string {
  const d = Date.now() / 1000 - utcSeconds;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

/* ---- Skeleton ---- */
export function SkeletonRows({ cols, count = 9 }: { cols: number[]; count?: number }) {
  return (
    <div style={{ padding: '8px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            opacity: 1 - i * 0.09,
          }}
        >
          {cols.map((w, j) => (
            <div key={j} className="skeleton" style={{ height: 13, flex: `0 0 ${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---- Error ---- */
export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>⚠</div>
      <div style={{ color: 'var(--rose)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
        {message}
      </div>
    </div>
  );
}

/* ---- Show more row ---- */
export function ShowMoreRow({
  total,
  showing,
  expanded,
  onToggle,
  colSpan = 3,
}: {
  total: number;
  showing: number;
  expanded: boolean;
  onToggle: () => void;
  colSpan?: number;
}) {
  if (total <= 10) return null;
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', padding: '10px 14px', borderBottom: 'none' }}>
        <button className="show-more-btn" onClick={e => { e.stopPropagation(); onToggle(); }}>
          {expanded
            ? '↑ show less'
            : `↓ ${total - showing} more`}
        </button>
      </td>
    </tr>
  );
}
interface PanelProps<T> {
  state: DataState<T>;
  title: string;
  count?: number;
  meta?: string;
  accentClass?: string;
  skeletonCols?: number[];
  children: (data: T) => ReactNode;
}

export function Panel<T>({
  state,
  title,
  meta,
  accentClass = 'badge-violet',
  skeletonCols = [5, 60, 15],
  children,
}: PanelProps<T>) {
  const { data, loading, error } = state;
  const count = Array.isArray(data) ? (data as unknown[]).length : undefined;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
        {count !== undefined && (
          <span className={`badge ${accentClass}`}>{count}</span>
        )}
        <div style={{ flex: 1 }} />
        {meta && (
          <span style={{
            fontSize: 10,
            color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
          }}>
            {meta}
          </span>
        )}
        {loading && (
          <div
            className="pulse"
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', marginLeft: 4 }}
          />
        )}
      </div>

      <div className="panel-body">
        {loading && !data && <SkeletonRows cols={skeletonCols} />}
        {error && !data && <ErrorState message={error} />}
        {data && <div className="fade-up tbl-scroll-wrapper">{children(data)}</div>}
      </div>
    </div>
  );
}
