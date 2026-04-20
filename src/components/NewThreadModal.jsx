import { useState } from 'react';
import { useApp } from '../store/AppContext.jsx';

const KINDS = ['project', 'topic', 'person'];

export default function NewThreadModal({ onClose, initialTitle = '' }) {
  const { createThread } = useApp();
  const [title, setTitle] = useState(initialTitle);
  const [kind, setKind] = useState('project');
  const [tagsRaw, setTagsRaw] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    const tags = tagsRaw.split(/[\s,]+/).filter(t => t).map(t => t.startsWith('#') ? t : `#${t}`);
    await createThread({ title: title.trim(), kind, tags });
    onClose();
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreate(); }
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="sk-card"
        style={{ width: 480, padding: 24, background: 'var(--paper)' }}
      >
        <div className="font-sketch" style={{ fontSize: 20, marginBottom: 16 }}>New thread</div>

        <div style={{ marginBottom: 12 }}>
          <div className="kicker" style={{ marginBottom: 4 }}>Title</div>
          <input
            autoFocus
            className="sk-input"
            placeholder="e.g. Q2 Roadmap, Priya 1:1s, Vendor contract"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="kicker" style={{ marginBottom: 6 }}>Kind</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {KINDS.map(k => (
              <button
                key={k}
                className={`btn ${kind === k ? '' : 'btn-soft'}`}
                style={{
                  borderStyle: kind === k ? 'solid' : 'dashed',
                  background: kind === k ? 'var(--ink)' : 'transparent',
                  color: kind === k ? 'var(--paper)' : 'var(--ink-2)',
                }}
                onClick={() => setKind(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="kicker" style={{ marginBottom: 4 }}>Tags (space or comma separated)</div>
          <input
            className="sk-input"
            placeholder="#planning #hiring #q2"
            value={tagsRaw}
            onChange={e => setTagsRaw(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-soft" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!title.trim() || saving}>
            Create thread <span className="kbd">⏎</span>
          </button>
        </div>
      </div>
    </div>
  );
}
