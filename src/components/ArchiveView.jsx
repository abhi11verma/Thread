import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { Tag, Person, StateChip } from './atoms/Chips.jsx';
import { formatDate } from '../lib/utils.js';

export default function ArchiveView() {
  const { threads, openThread, updateThread } = useApp();
  const [search, setSearch] = useState('');

  const archived = useMemo(() => {
    const q = search.toLowerCase().trim();
    return threads
      .filter(t => t.status === 'closed' || t.status === 'paused')
      .filter(t => !q || t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.created) - new Date(a.created));
  }, [threads, search]);

  const closed = archived.filter(t => t.status === 'closed');
  const paused = archived.filter(t => t.status === 'paused');

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 40px', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 className="font-sketch" style={{ margin: 0, fontSize: 26, fontWeight: 400 }}>Archive</h1>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
          {archived.length} thread{archived.length !== 1 ? 's' : ''}
        </span>
      </div>

      <input
        className="sk-input"
        style={{ width: '100%', maxWidth: 360, marginBottom: 24, padding: '6px 10px', fontSize: 13 }}
        placeholder="Search archived threads…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {archived.length === 0 && (
        <div className="placeholder">
          {search ? 'No archived threads match your search.' : 'No archived threads yet. Close or pause a thread to archive it.'}
        </div>
      )}

      {paused.length > 0 && (
        <Section
          label="Paused"
          threads={paused}
          onOpen={openThread}
          onReopen={id => updateThread(id, { status: 'active' })}
          onClose={id => updateThread(id, { status: 'closed' })}
        />
      )}

      {closed.length > 0 && (
        <Section
          label="Closed"
          threads={closed}
          onOpen={openThread}
          onReopen={id => updateThread(id, { status: 'active' })}
          onClose={null}
        />
      )}
    </main>
  );
}

function Section({ label, threads, onOpen, onReopen, onClose }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div className="kicker" style={{ marginBottom: 10 }}>{label} — {threads.length}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {threads.map(t => (
          <ThreadRow key={t.id} t={t} onOpen={onOpen} onReopen={onReopen} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

function ThreadRow({ t, onOpen, onReopen, onClose }) {
  const blockCount = t.blocks.length;
  const openFUs = t.blocks.filter(b => b.type === 'FOLLOWUP' && b.state !== 'closed' && b.state !== 'checked').length;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 12px', borderRadius: 6, cursor: 'pointer',
        border: '1px solid transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--paper-2)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
      onClick={() => onOpen(t.id)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.title}
          </span>
          <StateChip state={t.status === 'paused' ? 'waiting' : 'closed'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{t.kind}</span>
          {t.created && (
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>· {t.created.slice(0, 10)}</span>
          )}
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>· {blockCount} entries</span>
          {openFUs > 0 && (
            <span style={{ fontSize: 10.5, color: 'var(--warn)' }}>· {openFUs} open FU</span>
          )}
          {t.tags.map(tag => <Tag key={tag} t={tag} />)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          className="btn btn-soft"
          style={{ fontSize: 11, padding: '2px 8px' }}
          onClick={() => onReopen(t.id)}
        >
          Reopen
        </button>
        {onClose && (
          <button
            className="btn btn-soft"
            style={{ fontSize: 11, padding: '2px 8px' }}
            onClick={() => onClose(t.id)}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
