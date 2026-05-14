import { useState } from 'react';
import type { DataState } from '../hooks/useData';
import type { HFModel } from '../types';
import { Panel, formatNum, ShowMoreRow } from './shared';

interface Props {
  state: DataState<HFModel[]>;
  onRefresh: () => void;
}

const TASK_COLORS: Record<string, string> = {
  'text-generation':         'badge-violet',
  'text2text-generation':    'badge-violet',
  'image-text-to-text':      'badge-sky',
  'text-to-image':           'badge-sky',
  'automatic-speech-recognition': 'badge-emerald',
  'fill-mask':               'badge-dim',
  'feature-extraction':      'badge-dim',
  'sentence-similarity':     'badge-dim',
  'question-answering':      'badge-amber',
  'translation':             'badge-emerald',
  'summarization':           'badge-violet',
  'image-classification':    'badge-sky',
  'object-detection':        'badge-sky',
};

function taskBadge(tag?: string) {
  if (!tag) return null;
  const cls = TASK_COLORS[tag] ?? 'badge-dim';
  const label = tag.replace(/-/g, ' ');
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function ModelsPanel({ state }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Panel
      state={state}
      title="Models"
      meta="HUGGINGFACE · TRENDING"
      accentClass="badge-sky"
      skeletonCols={[4, 35, 22, 15, 12]}
    >
      {(models) => {
        const visible = expanded ? models : models.slice(0, 10);
        return (
          <table className="tbl">
            <thead>
              <tr>
                <th>Model</th>
                <th style={{ width: 120 }}>Task</th>
                <th style={{ width: 80, textAlign: 'right' }}>Likes</th>
                <th style={{ width: 100, textAlign: 'right' }}>Downloads</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <tr key={m.id} className="tbl-row" onClick={() => window.open(`https://huggingface.co/${m.id}`, '_blank')}>
                  <td>
                    <div>
                      <span className="ext" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>
                        {m.id}
                      </span>
                    </div>
                  </td>
                  <td>{taskBadge(m.pipeline_tag)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="badge badge-amber">♥ {formatNum(m.likes)}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                      {formatNum(m.downloads)}
                    </span>
                  </td>
                </tr>
              ))}
              <ShowMoreRow total={models.length} showing={visible.length} expanded={expanded} onToggle={() => setExpanded(v => !v)} colSpan={4} />
            </tbody>
          </table>
        );
      }}
    </Panel>
  );
}

