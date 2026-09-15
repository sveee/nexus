import { useState, useRef, useEffect } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { DataState } from '../hooks/useData';
import type { KarpathyTweet } from '../types';
import { SkeletonRows, ErrorState } from './shared';

interface Props {
  state: DataState<KarpathyTweet[]>;
  onRefresh: () => void;
}

const PREVIEW_COUNT = 10;

function relativeDate(pubDate: string): string {
  const d = Date.now() - new Date(pubDate).getTime();
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function TweetCard({ tweet }: { tweet: KarpathyTweet }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight);
  }, []);

  return (
    <div className="tweet-card" onClick={() => window.open(tweet.url, '_blank')}>
      <p ref={textRef} className={`tweet-card-text${expanded ? ' tweet-card-text--expanded' : ''}`}>{tweet.text}</p>
      <div className="tweet-card-footer">
        {tweet.isRetweet && <span className="badge badge-dim">RT</span>}
        {tweet.isQuote && tweet.quotedAuthor && (
          <span className="badge badge-fuchsia" style={{ fontSize: 10 }}>
            ↩ {tweet.quotedAuthor.replace(/ \(@.*?\)$/, '')}
          </span>
        )}
        <span>{relativeDate(tweet.pubDate)}</span>
        <div style={{ flex: 1 }} />
        {(isClamped || expanded) && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: expanded ? 'rgba(232,121,249,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${expanded ? 'rgba(232,121,249,0.3)' : 'var(--border)'}`,
              borderRadius: 12,
              cursor: 'pointer',
              color: expanded ? 'var(--fuchsia)' : 'var(--text-2)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              padding: '3px 9px',
              transition: 'all 0.13s',
            }}
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'collapse' : 'read more'}
          </button>
        )}
        <a
          href={tweet.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ExternalLink size={11} />
          x.com
        </a>
      </div>
    </div>
  );
}

export default function KarpathyPanel({ state }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { data, loading, error } = state;

  const tweets = data ?? [];
  const visible = expanded ? tweets : tweets.slice(0, PREVIEW_COUNT);
  const remaining = tweets.length - PREVIEW_COUNT;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
          Karpathy
        </h2>
        {tweets.length > 0 && (
          <span className="badge badge-fuchsia">{tweets.length}</span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
          @KARPATHY · TWEETS
        </span>
        {loading && (
          <div className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fuchsia)', marginLeft: 4 }} />
        )}
      </div>

      <div className="panel-body">
        {loading && !data && <SkeletonRows cols={[80, 15]} count={5} />}
        {error && !data && <ErrorState message={error} />}
        {data && (
          <div className="fade-up">
            {visible.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)}

            {tweets.length > PREVIEW_COUNT && (
              <div style={{ padding: '12px', textAlign: 'center' }}>
                <button
                  className="show-more-btn"
                  onClick={() => setExpanded(v => !v)}
                >
                  {expanded ? '↑ show less' : `↓ ${remaining} more`}
                </button>
              </div>
            )}

            <div style={{ padding: '10px 12px 14px', textAlign: 'center' }}>
              <a
                href="https://x.com/karpathy"
                target="_blank"
                rel="noopener noreferrer"
                className="show-more-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                View older tweets on X ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
