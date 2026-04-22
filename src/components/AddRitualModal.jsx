import { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';

const DEFAULT_LABEL = 'New ritual';

export default function AddRitualModal({ onClose }) {
  const { addRitual } = useApp();
  const [label, setLabel] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function handleSave() {
    const finalLabel = label.trim() || DEFAULT_LABEL;
    if (saving) return;
    setSaving(true);
    await addRitual({ label: finalLabel, detail: detail.trim() });
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 460,
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        <input
          ref={titleRef}
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') editorRef.current?.focus(); if (e.key === 'Escape') onClose(); }}
          placeholder="New ritual"
          className="sk-input"
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: -0.3,
            padding: '9px 12px',
            marginBottom: 16,
          }}
        />

        <div style={{ marginBottom: 24 }}>
          <div
            className="sk-rich-input"
            style={{ minHeight: 110 }}
            onClick={() => editorRef.current?.focus()}
          >
            <MarkdownEditor
              ref={editorRef}
              initialValue=""
              placeholder="e.g. 3 lines · what's on my mind"
              onChange={setDetail}
              minHeight={88}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-soft" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            Add ritual
          </button>
        </div>
      </div>
    </div>
  );
}
