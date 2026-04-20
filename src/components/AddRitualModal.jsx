import { useState } from 'react';
import { useApp } from '../store/AppContext.jsx';

export default function AddRitualModal({ onClose }) {
  const { addRitual } = useApp();
  const [label, setLabel] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!label.trim()) return;
    setSaving(true);
    await addRitual({ label: label.trim(), detail: detail.trim() });
    onClose();
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
      <div className="sk-card" style={{ width: 400, padding: 24, background: 'var(--paper)' }}>
        <div className="font-sketch" style={{ fontSize: 20, marginBottom: 4 }}>Add to The Daily</div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 16 }}>
          A daily habit or ritual you want to track.
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="kicker" style={{ marginBottom: 4 }}>Name</div>
          <input
            autoFocus
            className="sk-input"
            placeholder="e.g. Morning journal, Meditate · 10 min"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="kicker" style={{ marginBottom: 4 }}>Detail (optional)</div>
          <input
            className="sk-input"
            placeholder="e.g. 3 lines · what's on my mind"
            value={detail}
            onChange={e => setDetail(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-soft" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!label.trim() || saving}>
            Add ritual
          </button>
        </div>
      </div>
    </div>
  );
}
