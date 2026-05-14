import { useState, Fragment } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { DataState } from '../hooks/useData';
import type { Paper, PaperSummary } from '../types';
import { api } from '../api';
import { Panel, formatNum, ShowMoreRow } from './shared';

interface Props {
  state: DataState<Paper[]>;
  onRefresh: () => void;
}

interface SummaryState { loading: boolean; data: PaperSummary | null; error?: string }

export default function PapersPanel({ state }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, SummaryState>>({});

  function toggleSummary(e: React.MouseEvent, arxivId: string) {
    e.stopPropagation();
    if (expandedId === arxivId) { setExpandedId(null); return; }
    setExpandedId(arxivId);
    if (summaries[arxivId]) return;
    setSummaries(s => ({ ...s, [arxivId]: { loading: true, data: null } }));
    api.paperSummary(arxivId)
      .then(res => setSummaries(s => ({ ...s, [arxivId]: { loading: false, data: res.data } })))
      .catch(err => setSummaries(s => ({ ...s, [arxivId]: { loading: false, data: null, error: String(err) } })));
  }

  return (
    <Panel
      state={state}
      title="Papers"
      meta="HUGGINGFACE · WEEKLY"
      accentClass="badge-violet"
      skeletonCols={[72, 12]}
    >
      {(papers) => {
        const visible = expanded ? papers : papers.slice(0, 10);
        return (
          <table className="tbl">
            <thead>
              <tr>
                <th>Title</th>
                <th style={{ width: 90, textAlign: 'right' }}>Votes</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const arxivId = p.url.split('/').pop() ?? '';
                const isOpen = expandedId === arxivId;
                const summary = summaries[arxivId];
                return (
                  <Fragment key={p.url}>
                    <tr className="tbl-row" onClick={() => window.open(p.url, '_blank')}>
                      <td>
                        <span className="ext" style={{ fontWeight: 500, lineHeight: 1.45, display: 'block', maxWidth: 780 }}>
                          {p.title}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="badge badge-amber">▲ {formatNum(p.likes)}</span>
                      </td>
                      <td>
                        <button
                          onClick={(e) => toggleSummary(e, arxivId)}
                          title="Toggle AI summary"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 24, height: 24, borderRadius: 4,
                            border: '1px solid var(--border)',
                            background: isOpen ? 'rgba(124,58,237,0.15)' : 'transparent',
                            color: isOpen ? 'var(--violet-b)' : 'var(--text-3)',
                            cursor: 'pointer',
                            transition: 'background 0.13s, color 0.13s',
                          }}
                        >
                          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="paper-summary-row">
                        <td colSpan={3}>
                          {summary?.loading && (
                            <p className="paper-summary-text" style={{ opacity: 0.5 }}>Loading summary…</p>
                          )}
                          {summary?.error && (
                            <p className="paper-summary-text" style={{ color: 'var(--rose)' }}>Could not load summary.</p>
                          )}
                          {summary?.data && (
                            <>
                              {summary.data.ai_summary && (
                                <p className="paper-summary-text">{summary.data.ai_summary}</p>
                              )}
                              {summary.data.ai_keywords && summary.data.ai_keywords.length > 0 && (
                                <div className="paper-keywords">
                                  {summary.data.ai_keywords.map(k => (
                                    <span key={k} className="badge badge-violet" style={{ fontSize: 10 }}>{k}</span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              <ShowMoreRow total={papers.length} showing={visible.length} expanded={expanded} onToggle={() => setExpanded(v => !v)} colSpan={3} />
            </tbody>
          </table>
        );
      }}
    </Panel>
  );
}
