import { useState } from 'react';
import type { DataState } from '../hooks/useData';
import type { HFDataset } from '../types';
import { Panel, formatNum, ShowMoreRow } from './shared';

interface Props {
  state: DataState<HFDataset[]>;
  onRefresh: () => void;
}

export default function DatasetsPanel({ state }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Panel
      state={state}
      title="Datasets"
      meta="HUGGINGFACE · TRENDING"
      accentClass="badge-amber"
      skeletonCols={[4, 40, 20, 15, 12]}
    >
      {(datasets) => {
        const visible = expanded ? datasets : datasets.slice(0, 10);
        return (
          <table className="tbl">
            <thead>
              <tr>
                <th>Dataset</th>
                <th style={{ width: 160 }}>Author</th>
                <th style={{ width: 90, textAlign: 'right' }}>Likes</th>
                <th style={{ width: 110, textAlign: 'right' }}>Downloads</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => {
                const [author, name] = d.id.includes('/') ? d.id.split('/') : [d.author, d.id];
                return (
                  <tr key={d.id} className="tbl-row" onClick={() => window.open(`https://huggingface.co/datasets/${d.id}`, '_blank')}>
                    <td>
                      <span className="ext" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>
                        {name ?? d.id}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-2)' }}>{author}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-amber">♥ {formatNum(d.likes)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                        {formatNum(d.downloads)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <ShowMoreRow total={datasets.length} showing={visible.length} expanded={expanded} onToggle={() => setExpanded(v => !v)} colSpan={4} />
            </tbody>
          </table>
        );
      }}
    </Panel>
  );
}
