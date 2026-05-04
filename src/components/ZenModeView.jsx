import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import { IconX } from './atoms/Icons.jsx';

const STORAGE_KEY = 'thread-zen-content';

function extractHeadings(doc) {
  const headings = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({ level: node.attrs.level, text: node.textContent, pos });
    }
  });
  return headings;
}

export default function ZenModeView({ onClose }) {
  const [headings, setHeadings] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef(null);

  const initialContent = localStorage.getItem(STORAGE_KEY) || '';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Markdown.configure({ html: false, transformPastedText: true, transformCopiedText: true }),
      Placeholder.configure({ placeholder: 'Start writing… use # for headings, ## for sections' }),
    ],
    content: initialContent,
    autofocus: 'end',
    onUpdate({ editor }) {
      setHeadings(extractHeadings(editor.state.doc));
      setSaved(false);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, editor.storage.markdown.getMarkdown());
        setSaved(true);
      }, 800);
    },
  });

  // Extract headings on mount once editor is ready
  useEffect(() => {
    if (editor) setHeadings(extractHeadings(editor.state.doc));
  }, [editor]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const scrollToHeading = useCallback((pos) => {
    if (!editor) return;
    try {
      const domNode = editor.view.nodeDOM(pos);
      if (domNode) {
        domNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      editor.chain().focus().setTextSelection(pos + 1).run();
    } catch (_) {}
  }, [editor]);

  // Close on Escape (but don't interfere with editor's own Escape handling)
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !e.defaultPrevented) onClose();
    }
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 18px', gap: 10, flexShrink: 0,
          borderBottom: '1px solid var(--line)',
        }}
      >
        <button
          onClick={onClose}
          title="Exit zen mode (Esc)"
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--paper-3)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-soft)', flexShrink: 0,
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--line-strong)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--paper-3)'; }}
        >
          <IconX size={12} />
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="font-mono"
            style={{
              fontSize: 11, color: 'var(--ink-faint)',
              transition: 'opacity 0.2s',
              opacity: saved ? 1 : 0.5,
            }}
          >
            {saved ? 'saved' : 'saving…'}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── TOC panel ── */}
        <div
          style={{
            width: collapsed ? 44 : 240,
            flexShrink: 0,
            borderRight: '1px solid var(--line)',
            transition: 'width 0.22s ease',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: collapsed ? '24px 0 16px' : '24px 16px 16px',
          }}
        >
          {/* Heading label */}
          {!collapsed && (
            <div
              style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
                color: 'var(--ink-soft)', textTransform: 'uppercase',
                marginBottom: 10, flexShrink: 0,
              }}
            >
              Contents
            </div>
          )}

          {/* Empty state */}
          {headings.length === 0 && !collapsed && (
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontStyle: 'italic', lineHeight: 1.6 }}>
              Use # headings to build a table of contents as you write.
            </div>
          )}

          {/* TOC items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: collapsed ? 0 : 1 }}>
            {headings.map((h, i) =>
              collapsed ? (
                /* Dot view */
                <button
                  key={i}
                  onClick={() => scrollToHeading(h.pos)}
                  title={h.text}
                  style={{
                    width: h.level === 1 ? 8 : h.level === 2 ? 6 : 5,
                    height: h.level === 1 ? 8 : h.level === 2 ? 6 : 5,
                    borderRadius: '50%',
                    background: 'var(--ink-faint)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    margin: `${h.level === 1 ? 6 : 4}px auto`,
                    display: 'block', flexShrink: 0,
                    transition: 'background 0.12s, transform 0.12s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--accent)';
                    e.currentTarget.style.transform = 'scale(1.35)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--ink-faint)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              ) : (
                /* Text view */
                <button
                  key={i}
                  onClick={() => scrollToHeading(h.pos)}
                  style={{
                    textAlign: 'left', background: 'none', border: 'none',
                    cursor: 'pointer',
                    paddingTop: 3, paddingBottom: 3, paddingRight: 4,
                    paddingLeft: (h.level - 1) * 14,
                    fontSize: h.level === 1 ? 13 : h.level === 2 ? 12 : 11,
                    fontWeight: h.level === 1 ? 500 : 400,
                    color: h.level === 1 ? 'var(--ink)' : 'var(--ink-soft)',
                    lineHeight: 1.4, width: '100%', fontFamily: 'inherit',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    borderRadius: 4,
                    transition: 'color 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--accent)';
                    e.currentTarget.style.background = 'var(--paper-2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = h.level === 1 ? 'var(--ink)' : 'var(--ink-soft)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {h.text}
                </button>
              )
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand contents' : 'Collapse contents'}
            style={{
              marginTop: 16, background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-faint)', padding: '4px',
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 4, width: '100%', fontSize: 11, borderRadius: 4,
              transition: 'color 0.1s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>{collapsed ? '›' : '‹'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* ── Editor area ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
            padding: '52px 40px 100px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 720 }}>
            <EditorContent editor={editor} className="zen-editor" />
          </div>
        </div>
      </div>
    </div>
  );
}
