import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { IconSearch, IconThread, IconChev, IconPlus, IconNote } from './atoms/Icons.jsx';
import { Tag } from './atoms/Chips.jsx';

export default function SearchModal({ onClose, onNewThread }) {
  const { threads, addScratch } = useApp();
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleInputKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.metaKey || e.ctrlKey) {
        createThread();
      } else if (noMatch) {
        saveToScratch();
      } else if (matched.length > 0) {
        openAndClose(matched[0].id);
      }
    }
  }

  const { openThread } = useApp();

  const matched = useMemo(() =>
    query.length > 1
      ? threads.filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
      : threads.slice(0, 6)
  , [query, threads]);

  const noMatch = query.length > 1 && matched.length === 0;

  async function saveToScratch() {
    if (!query.trim() || saving) return;
    setSaving(true);
    await addScratch(query.trim());
    setSaving(false);
    onClose();
  }

  function openAndClose(threadId) {
    openThread(threadId);
    onClose();
  }

  function createThread() {
    onClose();
    onNewThread(query.trim());
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '14vh',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="sk-card sk-modal"
        style={{ width: 560, background: 'var(--paper)', overflow: 'hidden', padding: 0 }}
      >
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
          <IconSearch size={15} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 15,
              background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit',
            }}
            placeholder="Search threads…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKey}
          />
          <span className="kbd" style={{ fontSize: 10 }}>esc</span>
        </div>

        {/* Results */}
        {!noMatch && (
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {query.length < 2 && (
              <div className="kicker" style={{ padding: '8px 16px 4px', color: 'var(--ink-faint)' }}>Recent threads</div>
            )}
            {matched.map(t => (
              <div
                key={t.id}
                onClick={() => openAndClose(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 16px', cursor: 'pointer',
                  borderBottom: '1px solid var(--line)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-3)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <IconThread size={13} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  {t.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                      {t.tags.map(x => <Tag key={x} t={x} />)}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink-soft)', flexShrink: 0 }}>
                  {t.blocks.filter(b => b.type === 'FOLLOWUP' && b.state !== 'closed').length} open
                </span>
                <IconChev size={12} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}

        {/* No match — two actions, no extra box */}
        {noMatch && (
          <div>
            <div style={{ padding: '10px 16px 6px' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                No threads matching "<b>{query}</b>"
              </span>
            </div>
            <div
              onClick={saveToScratch}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', cursor: 'pointer',
                borderTop: '1px solid var(--line)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-3)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <IconNote size={13} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5 }}>Save to scratch</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>"{query}"</div>
              </div>
              <span className="kbd">⏎</span>
            </div>
            <div
              onClick={createThread}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', cursor: 'pointer',
                borderTop: '1px solid var(--line)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-3)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <IconPlus size={13} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5 }}>Create new thread</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>"{query}"</div>
              </div>
              <span className="kbd">⌘⏎</span>
            </div>
          </div>
        )}

        {/* Bottom hint */}
        {!noMatch && query.length > 1 && (
          <div
            onClick={createThread}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderTop: '1px solid var(--line)',
              cursor: 'pointer', background: 'var(--paper-2)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--paper-2)'}
          >
            <IconPlus size={12} style={{ color: 'var(--ink-soft)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', flex: 1 }}>
              Create new thread "<b style={{ color: 'var(--ink)' }}>{query}</b>"
            </span>
            <span className="kbd">⌘⏎</span>
          </div>
        )}
      </div>
    </div>
  );
}
