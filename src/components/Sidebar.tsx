import { LayoutGrid, BookOpen, Cpu, Github, Database, BarChart2, AtSign } from 'lucide-react';
import type { Section } from '../types';
import type { DataState } from '../hooks/useData';

interface SidebarProps {
  active: Section;
  onSelect: (s: Section) => void;
  states: Partial<Record<Section, DataState<unknown>>>;
  open: boolean;
}

const ITEMS = [
  {
    id:    'overview' as Section,
    label: 'Overview',
    sub:   'At a glance',
    Icon:  LayoutGrid,
    color: 'var(--text)',
  },
  {
    id:    'benchmarks' as Section,
    label: 'Benchmarks',
    sub:   'Rankings · Cost · Evals',
    Icon:  BarChart2,
    color: 'var(--orange)',
  },
  {
    id:    'papers'   as Section,
    label: 'Papers',
    sub:   'HuggingFace · Weekly',
    Icon:  BookOpen,
    color: 'var(--violet-b)',
  },
  {
    id:    'karpathy' as Section,
    label: 'Karpathy',
    sub:   '@karpathy · Tweets',
    Icon:  AtSign,
    color: 'var(--fuchsia)',
  },
  {
    id:    'models'   as Section,
    label: 'Models',
    sub:   'HF Trending',
    Icon:  Cpu,
    color: 'var(--sky)',
  },
  {
    id:    'github'   as Section,
    label: 'GitHub',
    sub:   'Trending · Weekly',
    Icon:  Github,
    color: 'var(--emerald)',
  },
  {
    id:    'datasets' as Section,
    label: 'Datasets',
    sub:   'HF Trending',
    Icon:  Database,
    color: 'var(--amber)',
  },
] as const;

export default function Sidebar({ active, onSelect, states, open }: SidebarProps) {
  return (
    <aside className={`sidebar${open ? ' open' : ' closed'}`}>
      {ITEMS.map(({ id, label, sub, Icon, color }) => {
        const isActive = active === id;
        const st = states[id];
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`nav-btn${isActive ? ' active' : ''}`}
            data-s={id}
          >
            <Icon
              size={15}
              style={{
                color: isActive ? color : 'var(--text-3)',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>
                {label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                {sub}
              </div>
            </div>

            {/* State indicator (overview has no data source) */}
            {st?.loading && (
              <div
                className="pulse"
                style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }}
              />
            )}
            {st && !st.loading && st.error && (
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
            )}
            {st && !st.loading && !st.error && st.data !== null && (
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, opacity: 0.35, flexShrink: 0 }} />
            )}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <div style={{
        padding: '8px 10px',
        fontSize: 10,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.05em',
      }}>
        nexus · ml dashboard
      </div>
    </aside>
  );
}
