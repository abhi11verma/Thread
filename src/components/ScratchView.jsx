import { useState } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { relativeTime } from '../lib/utils.js';

export default function ScratchView() {
  const { scratches, threads, deleteScratch, assignScratch } = useApp();
  const [assigningId, setAssigningId] = useState(null);
  const [justAssignedIds, setJustAssignedIds] = useState(new Set());

  function handleAssign(scratchId, threadId) {
    assignScratch(scratchId, threadId);
    setJustAssignedIds(prev => new Set([...prev, scratchId]));
    setAssigningId(null);
  }

  const visible = scratches.filter(s => s.threadId === 'unassigned' || justAssignedIds.has(s.id));

  return (
    <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '22px 28px 40px', background: 'var(--paper)' }}>
      <h1 className="font-sketch" style={{ margin: '0 0 4px', fontWeight: 400, fontSize: 26 }}>Scratch</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--ink-soft)' }}>
        Unthreaded notes — captured fast, assign to a thread when ready.
      </p>

      {visible.length === 0 && (
        <div style={{ color: 'var(--ink-soft)', fontSize: 13 }}>No scratch notes yet.</div>
      )}

      {visible.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Unassigned · {scratches.filter(s => s.threadId === 'unassigned').length}</div>
          <div className="sk-card" style={{ overflow: 'hidden', padding: 0 }}>
            {visible.map((s, i) => {
              const thread = justAssignedIds.has(s.id) ? threads.find(t => t.id === s.threadId) : null;
              return (
                <ScratchRow
                  key={s.id}
                  s={s}
                  threads={threads}
                  assigningId={assigningId}
                  setAssigningId={setAssigningId}
                  onAssign={handleAssign}
                  onDelete={deleteScratch}
                  threadLabel={thread?.title}
                  last={i === visible.length - 1}
                />
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function ScratchRow({ s, threads, assigningId, setAssigningId, onAssign, onDelete, threadLabel, last }) {
  const isAssigning = assigningId === s.id;

  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>{s.text}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>
              {relativeTime(s.created)}
            </span>
            {threadLabel && (
              <span className="chip chip-tag" style={{ fontSize: 10 }}>↳ {threadLabel}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            className="btn btn-soft"
            style={{ padding: '2px 8px', fontSize: 11 }}
            onClick={() => setAssigningId(isAssigning ? null : s.id)}
          >
            {isAssigning ? 'cancel' : 'assign →'}
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '2px 6px', fontSize: 13, color: 'var(--ink-soft)' }}
            onClick={() => onDelete(s.id)}
          >
            ×
          </button>
        </div>
      </div>

      {isAssigning && (
        <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="kicker" style={{ marginBottom: 4 }}>Pick a thread</div>
          {threads.map(t => (
            <div
              key={t.id}
              onClick={() => onAssign(s.id, t.id)}
              style={{
                padding: '6px 8px', borderRadius: 5, cursor: 'pointer',
                fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-3)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <span>{t.title}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{t.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
