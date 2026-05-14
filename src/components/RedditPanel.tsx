import { useState } from 'react';
import { MessageSquare, ArrowUp } from 'lucide-react';
import type { DataState } from '../hooks/useData';
import type { RedditData, RedditPost } from '../types';
import { formatNum, timeAgo, SkeletonRows, ErrorState, ShowMoreRow } from './shared';

interface Props {
  state: DataState<RedditData>;
  onRefresh: () => void;
}

type Sub = 'LocalLLaMA' | 'LocalLLM';

function PostRow({ post }: { post: RedditPost }) {
  const isExternal = !post.url.includes('reddit.com');
  return (
    <tr className="tbl-row" onClick={() => window.open(isExternal ? post.url : post.permalink, '_blank')}>
      <td style={{ width: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowUp size={11} style={{ color: 'var(--rose)', flexShrink: 0 }} />
          <span className="badge badge-rose" style={{ minWidth: 42 }}>{formatNum(post.score)}</span>
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {post.thumbnail && (
            <img
              src={post.thumbnail}
              alt=""
              style={{
                width: 56, height: 40,
                objectFit: 'cover',
                borderRadius: 4,
                flexShrink: 0,
                opacity: 0.85,
                border: '1px solid var(--border)',
              }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="ext" style={{ fontWeight: 500, lineHeight: 1.45 }}>{post.title}</span>
        </div>
      </td>
      <td style={{ width: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-3)' }}>
          <MessageSquare size={10} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{formatNum(post.num_comments)}</span>
        </div>
      </td>
      <td style={{ width: 90 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{timeAgo(post.created_utc)}</span>
      </td>
    </tr>
  );
}

export default function RedditPanel({ state }: Props) {
  const [sub, setSub] = useState<Sub>('LocalLLaMA');
  const [expanded, setExpanded] = useState(false);
  const { data, loading, error } = state;

  const posts = data?.[sub] ?? [];
  const visible = expanded ? posts : posts.slice(0, 10);

  // Reset expansion when switching subreddits
  function handleSubChange(s: Sub) {
    setSub(s);
    setExpanded(false);
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
          Reddit
        </h2>

        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 3, marginLeft: 8 }}>
          {(['LocalLLaMA', 'LocalLLM'] as Sub[]).map((s) => (
            <button key={s} onClick={() => handleSubChange(s)} className={`subtab${sub === s ? ' active' : ''}`}>
              r/{s}
            </button>
          ))}
        </div>

        {posts.length > 0 && (
          <span className="badge badge-rose" style={{ marginLeft: 4 }}>{posts.length}</span>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
          TOP · WEEKLY
        </span>
        {loading && (
          <div className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', marginLeft: 4 }} />
        )}
      </div>

      <div className="panel-body">
        {loading && !data && <SkeletonRows cols={[8, 72, 8, 8]} />}
        {error && !data && <ErrorState message={error} />}
        {data && (
          <div className="fade-up tbl-scroll-wrapper">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Score</th>
                  <th>Title</th>
                  <th style={{ width: 80 }}>Comments</th>
                  <th style={{ width: 90 }}>Age</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => <PostRow key={p.id} post={p} />)}
                <ShowMoreRow total={posts.length} showing={visible.length} expanded={expanded} onToggle={() => setExpanded(v => !v)} colSpan={4} />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

