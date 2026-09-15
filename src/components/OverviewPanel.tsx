import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart2, BookOpen, Cpu, Github, Database, ArrowRight } from 'lucide-react';
import type { DataState } from '../hooks/useData';
import type { Section, BenchmarksData, Paper, HFModel, HFDataset, GitHubRepo } from '../types';
import { formatNum } from './shared';

interface Props {
  states: {
    benchmarks: DataState<BenchmarksData>;
    papers: DataState<Paper[]>;
    models: DataState<HFModel[]>;
    github: DataState<GitHubRepo[]>;
    datasets: DataState<HFDataset[]>;
  };
  onNavigate: (s: Section) => void;
}

const TOP = 5;

/* ---- Compact list row shared by every card ---- */
function OvRow({
  rank, primary, secondary, metric, metricClass, mono, onClick,
}: {
  rank: number;
  primary: string;
  secondary?: string;
  metric: string;
  metricClass: string;
  mono?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="ov-row" onClick={onClick}>
      <span className="ov-rank">{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ext ov-row-primary" style={mono ? { fontFamily: 'var(--font-mono)', fontSize: 12 } : undefined}>
          {primary}
        </div>
        {secondary && <div className="ov-row-secondary">{secondary}</div>}
      </div>
      <span className={`badge ${metricClass}`}>{metric}</span>
    </div>
  );
}

/* ---- Card wrapper: header + state handling + render-prop body ---- */
function OvCard<T>({
  title, meta, Icon, color, section, state, onNavigate, render,
}: {
  title: string;
  meta: string;
  Icon: LucideIcon;
  color: string;
  section: Section;
  state: DataState<T>;
  onNavigate: (s: Section) => void;
  render: (data: T) => ReactNode;
}) {
  const { data, loading, error } = state;
  return (
    <div className="ov-card" style={{ borderTop: `2px solid ${color}`, ['--ov-accent' as string]: color } as CSSProperties}>
      <div className="ov-card-head">
        <Icon size={15} style={{ color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ov-card-title">{title}</div>
          <div className="ov-card-meta">{meta}</div>
        </div>
        <button className="ov-view-all" onClick={() => onNavigate(section)}>
          View all <ArrowRight size={12} />
        </button>
      </div>
      <div className="ov-card-body">
        {loading && !data && (
          <div style={{ padding: '4px 0' }}>
            {Array.from({ length: TOP }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 12, margin: '12px 15px', opacity: 1 - i * 0.13 }} />
            ))}
          </div>
        )}
        {error && !data && <div className="ov-empty">⚠ failed to load</div>}
        {data && render(data)}
      </div>
    </div>
  );
}

export default function OverviewPanel({ states, onNavigate }: Props) {
  const open = (url: string) => window.open(url, '_blank');

  return (
    <div className="overview">
      <div className="overview-hero">
        <h1>At a glance</h1>
        <p>Top signals across every source — click into any card to drill down.</p>
      </div>

      <div className="overview-grid">
        <OvCard
          title="Benchmarks" meta="RANKINGS · COST · EVALS" Icon={BarChart2}
          color="var(--orange)" section="benchmarks" state={states.benchmarks} onNavigate={onNavigate}
          render={(d) => d.combined.slice(0, TOP).map((m, i) => (
            <OvRow
              key={m.name} rank={i + 1} primary={m.name} secondary={m.provider}
              metric={m.meanScore.toFixed(1)} metricClass="badge-orange"
              onClick={() => m.url && open(m.url)}
            />
          ))}
        />

        <OvCard
          title="Papers" meta="HUGGINGFACE · WEEKLY" Icon={BookOpen}
          color="var(--violet-b)" section="papers" state={states.papers} onNavigate={onNavigate}
          render={(d) => d.slice(0, TOP).map((p, i) => (
            <OvRow
              key={p.url} rank={i + 1} primary={p.title}
              metric={`▲ ${formatNum(p.likes)}`} metricClass="badge-violet"
              onClick={() => open(p.url)}
            />
          ))}
        />

        <OvCard
          title="Models" meta="HUGGINGFACE · TRENDING" Icon={Cpu}
          color="var(--sky)" section="models" state={states.models} onNavigate={onNavigate}
          render={(d) => d.slice(0, TOP).map((m, i) => (
            <OvRow
              key={m.id} rank={i + 1} primary={m.id} mono
              secondary={m.pipeline_tag?.replace(/-/g, ' ')}
              metric={`↓ ${formatNum(m.downloads)}`} metricClass="badge-sky"
              onClick={() => open(`https://huggingface.co/${m.id}`)}
            />
          ))}
        />

        <OvCard
          title="GitHub" meta="TRENDING · WEEKLY" Icon={Github}
          color="var(--emerald)" section="github" state={states.github} onNavigate={onNavigate}
          render={(d) => d.slice(0, TOP).map((r, i) => (
            <OvRow
              key={r.url} rank={i + 1} primary={r.name} mono
              secondary={r.language || undefined}
              metric={r.new_stars > 0 ? `+${formatNum(r.new_stars)}` : `★ ${formatNum(r.stars)}`}
              metricClass="badge-emerald"
              onClick={() => open(r.url)}
            />
          ))}
        />

        <OvCard
          title="Datasets" meta="HUGGINGFACE · TRENDING" Icon={Database}
          color="var(--amber)" section="datasets" state={states.datasets} onNavigate={onNavigate}
          render={(d) => d.slice(0, TOP).map((ds, i) => {
            const name = ds.id.includes('/') ? ds.id.split('/')[1] : ds.id;
            return (
              <OvRow
                key={ds.id} rank={i + 1} primary={name ?? ds.id} mono
                secondary={ds.author}
                metric={`↓ ${formatNum(ds.downloads)}`} metricClass="badge-amber"
                onClick={() => open(`https://huggingface.co/datasets/${ds.id}`)}
              />
            );
          })}
        />
      </div>
    </div>
  );
}
