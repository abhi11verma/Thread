import { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';

const KINDS = ['project', 'topic', 'person'];
const DEFAULT_TITLE = 'New thread';

export default function NewThreadModal({ onClose, initialTitle = '' }) {
  const { threads, createThread, addBlock } = useApp();
  const [title, setTitle] = useState(initialTitle || '');
  const [kind, setKind] = useState('project');
  const [tagsRaw, setTagsRaw] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function resolveTitle(raw) {
    const base = raw.trim() || DEFAULT_TITLE;
    const existing = new Set(threads.map(t => t.title.toLowerCase()));
    if (!existing.has(base.toLowerCase())) return base;
    let n = 1;
    while (existing.has(`${base} ${n}`.toLowerCase())) n++;
    return `${base} ${n}`;
  }

  async function handleCreate() {
    if (saving) return;
    setSaving(true);
    const finalTitle = resolveTitle(title);
    const tags = tagsRaw.split(/[\s,]+/).filter(t => t).map(t => t.startsWith('#') ? t : `#${t}`);
    const thread = await createThread({ title: finalTitle, kind, tags });
    if (thread && noteContent.trim()) {
      await addBlock(thread.id, { type: 'NOTE', text: noteContent.trim() });
    }
    onClose();
  }

  function handleTitleKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); editorRef.current?.focus(); }
    if (e.key === 'Escape') onClose();
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
          width: 520,
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        {/* Editable title */}
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleTitleKey}
          placeholder="New thread"
          className="sk-input"
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: -0.4,
            padding: '9px 12px',
            marginBottom: 16,
          }}
        />

        {/* Kind pills — compact, left-aligned */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {KINDS.map(k => (
            <button
              key={k}
              onClick={() => setKind(k)}
              style={{
                padding: '3px 10px',
                borderRadius: 99,
                border: '1.5px solid',
                borderColor: kind === k ? 'var(--ink)' : 'var(--line)',
                background: kind === k ? 'var(--ink)' : 'transparent',
                color: kind === k ? 'var(--paper)' : 'var(--ink-soft)',
                fontFamily: 'inherit',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {/* First note — WYSIWYG */}
        <div
          className="sk-rich-input"
          style={{ minHeight: 120, marginBottom: 20 }}
          onClick={() => editorRef.current?.focus()}
        >
          <MarkdownEditor
            ref={editorRef}
            initialValue=""
            placeholder="First note… (markdown supported)"
            onChange={setNoteContent}
            minHeight={96}
          />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 24 }}>
          <input
            className="sk-input"
            placeholder="Tags: #planning #hiring #q2"
            value={tagsRaw}
            onChange={e => setTagsRaw(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
            style={{ fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-soft" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
            Create thread <span className="kbd">⏎</span>
          </button>
        </div>
      </div>
    </div>
  );
}
