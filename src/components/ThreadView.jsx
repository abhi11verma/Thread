import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../store/AppContext.jsx';
import { FollowupLine, Tag, Person, StateChip } from './atoms/Chips.jsx';
import { IconChev, IconClock, IconCheck, IconArrowUp } from './atoms/Icons.jsx';
import { nanoid } from '../lib/nanoid.js';
import { today } from '../lib/utils.js';
import MarkdownEditor from './MarkdownEditor.jsx';

// Parse @mentions and [[dates]] out of raw text
function parseEntry(text) {
  const whoMatch = text.match(/@(\w+)/);
  const dueMatch = text.match(/\[\[(\d{4}-\d{2}-\d{2})\]\]/);
  return {
    who: whoMatch ? whoMatch[1] : '',
    due: dueMatch ? dueMatch[1] : '',
  };
}

function detectType(text, forceDecision) {
  if (forceDecision) return 'DECISION';
  if (/@\w+/.test(text) || /\[\[\d{4}-\d{2}-\d{2}\]\]/.test(text)) return 'FOLLOWUP';
  return 'NOTE';
}

// Process a plain string for @mentions, [[dates]], [[thread-slugs]]
function useInlineTokens() {
  const { threads, openThread } = useApp();
  return function renderInline(str, keyPrefix = '') {
    const parts = str.split(/(@\w+|\[\[\d{4}-\d{2}-\d{2}\]\]|\[\[[a-z][a-z0-9-]+\]\])/g);
    return parts.map((part, i) => {
      const key = keyPrefix + i;
      if (part.startsWith('@')) {
        return <span key={key} style={{ color: 'var(--accent)', fontWeight: 500 }}>{part}</span>;
      }
      if (/^\[\[\d{4}-\d{2}-\d{2}\]\]$/.test(part)) {
        return (
          <span key={key} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88em', color: 'var(--ink-soft)', background: 'var(--paper-3)', borderRadius: 3, padding: '0 3px' }}>
            {part.slice(2, -2)}
          </span>
        );
      }
      if (/^\[\[[a-z][a-z0-9-]+\]\]$/.test(part)) {
        const slug = part.slice(2, -2);
        const linked = threads.find(t => t.id === slug);
        return (
          <button
            key={key}
            onClick={e => { e.stopPropagation(); if (linked) openThread(linked.id); }}
            style={{
              display: 'inline', background: 'none', border: 'none', padding: '0 1px',
              fontFamily: 'inherit', fontSize: 'inherit',
              color: linked ? 'var(--accent)' : 'var(--ink-faint)',
              textDecoration: linked ? 'underline' : 'line-through',
              textDecorationStyle: 'dotted',
              cursor: linked ? 'pointer' : 'default',
              fontStyle: linked ? 'normal' : 'italic',
            }}
            title={linked ? `Open: ${linked.title}` : `Thread not found: ${slug}`}
          >
            {linked ? linked.title : slug}
          </button>
        );
      }
      return part;
    });
  };
}

// Render markdown with @mention / [[date]] / [[thread-slug]] support inside text nodes
function RichText({ text, style }) {
  const renderInline = useInlineTokens();

  function processChildren(children, keyPrefix = '') {
    return Array.isArray(children)
      ? children.map((child, i) =>
          typeof child === 'string' ? renderInline(child, `${keyPrefix}-${i}`) : child
        )
      : typeof children === 'string'
      ? renderInline(children, keyPrefix)
      : children;
  }

  const mdComponents = {
    p:      ({ children }) => <p style={{ margin: '0 0 6px 0' }}>{processChildren(children, 'p')}</p>,
    strong: ({ children }) => <strong>{processChildren(children, 's')}</strong>,
    em:     ({ children }) => <em>{processChildren(children, 'e')}</em>,
    li:     ({ children }) => <li>{processChildren(children, 'li')}</li>,
    a:      ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{children}</a>,
    code:   ({ inline, children }) => inline
      ? <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88em', background: 'var(--paper-3)', borderRadius: 3, padding: '0 4px' }}>{children}</code>
      : <pre style={{ background: 'var(--paper-3)', borderRadius: 8, padding: '10px 12px', overflowX: 'auto', fontSize: 12 }}><code style={{ fontFamily: 'JetBrains Mono, monospace' }}>{children}</code></pre>,
    ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: 18 }}>{children}</ol>,
  };

  return (
    <div style={{ ...style, lineHeight: 1.6 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default function ThreadView() {
  const { threads, activeThreadId, addBlock, updateBlock, updateThread, openThread } = useApp();
  const thread = threads.find(t => t.id === activeThreadId);

  const [text, setText] = useState('');
  const [forceDecision, setForceDecision] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const editorRef = useRef(null);

  // [[slug]] autocomplete state
  const [slugQuery, setSlugQuery] = useState(null);
  const [slugIdx, setSlugIdx] = useState(0);

  const slugSuggestions = useMemo(() => {
    if (slugQuery === null) return [];
    const q = slugQuery.toLowerCase();
    return threads
      .filter(t => t.id !== activeThreadId)
      .filter(t => q === '' || t.title.toLowerCase().includes(q) || t.id.includes(q))
      .slice(0, 8);
  }, [slugQuery, threads, activeThreadId]);

  // Reset composer when thread changes
  useEffect(() => {
    setText('');
    setForceDecision(false);
    setSlugQuery(null);
    setTimeout(() => {
      editorRef.current?.clear();
      editorRef.current?.focus();
    }, 0);
  }, [activeThreadId]);

  if (!thread) {
    return (
      <main style={{ flex: 1, padding: '40px 28px', color: 'var(--ink-soft)' }}>
        <div style={{ fontSize: 14 }}>Thread not found.</div>
      </main>
    );
  }

  const detectedType = detectType(text, forceDecision);
  const openFUs = thread.blocks.filter(b => b.type === 'FOLLOWUP' && b.state !== 'closed');
  const people = [...new Set(thread.blocks.filter(b => b.type === 'FOLLOWUP' && b.who).map(b => b.who))];

  const backlinks = useMemo(() => {
    if (!thread) return [];
    const pattern = new RegExp(`\\[\\[${thread.id}\\]\\]`);
    return threads.filter(t => t.id !== thread.id && t.blocks.some(b => pattern.test(b.text)));
  }, [threads, thread?.id]);

  function completeSugg(t) {
    editorRef.current?.insertSlugCompletion(t.id);
    setSlugQuery(null);
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    const type = detectedType;
    const { who, due } = type === 'FOLLOWUP' ? parseEntry(text) : { who: '', due: '' };
    const block = {
      type,
      text: text.trim(),
      date: today(),
      id: type.toLowerCase().slice(0, 3) + '-' + nanoid(6),
      ...(type === 'FOLLOWUP' ? { who, due, state: 'open', links: [] } : {}),
    };
    await addBlock(thread.id, block);
    setText('');
    setForceDecision(false);
    editorRef.current?.clear();
    editorRef.current?.focus();
  }

  function handleKey(e) {
    if (slugSuggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlugIdx(i => Math.min(i + 1, slugSuggestions.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlugIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); completeSugg(slugSuggestions[slugIdx]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setSlugQuery(null); return; }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(); return; }
    if (e.key === 'Escape') { e.preventDefault(); setText(''); setForceDecision(false); editorRef.current?.clear(); }
  }

  function cycleFollowupState(blockId, current) {
    const next = { open: 'waiting', waiting: 'checked', checked: 'closed', closed: 'open' }[current] || 'open';
    updateBlock(thread.id, blockId, { state: next });
  }

  // Group blocks by date for the feed (most recent first)
  const dateGroups = [];
  for (const b of thread.blocks) {
    const last = dateGroups[dateGroups.length - 1];
    if (last && last.date === b.date) {
      last.blocks.push(b);
    } else {
      dateGroups.push({ date: b.date, blocks: [b] });
    }
  }
  dateGroups.reverse();
  dateGroups.forEach(g => g.blocks.reverse());

  return (
    <main
      style={{
        flex: 1, minWidth: 0, overflowY: 'auto',
        padding: '18px 28px 40px',
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 24,
        background: 'var(--paper)',
      }}
    >
      {/* ── Left: feed + composer ── */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, justifyContent: 'space-between' }}>
          <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-soft)' }}>
            <span>threads</span><IconChev size={11} /><span>{thread.kind}</span><IconChev size={11} /><span>{thread.status}</span>
          </div>
          <button
            className="btn btn-soft"
            style={{ fontSize: 11.5, padding: '3px 9px' }}
            onClick={() => {
              const next = { active: 'paused', paused: 'active', closed: 'active' }[thread.status] || 'active';
              updateThread(thread.id, { status: next });
            }}
          >
            {thread.status === 'active' ? 'Pause' : thread.status === 'paused' ? 'Resume' : 'Reopen'}
          </button>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h1 className="font-sketch" style={{ margin: 0, fontSize: 26, fontWeight: 400, letterSpacing: 0.3 }}>
            {thread.title}
          </h1>
          <StateChip state={thread.status === 'active' ? 'open' : thread.status === 'paused' ? 'waiting' : 'closed'} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {thread.tags.map(t => <Tag key={t} t={t} />)}
          {people.map(p => <Person key={p} name={p} />)}
        </div>

        {/* Composer */}
        <div
          style={{
            background: 'var(--paper-2)',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 32,
            position: 'relative',
          }}
        >
          {/* [[slug]] autocomplete dropdown */}
          {slugSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: 'var(--paper-2)', border: '1px solid var(--line)',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              zIndex: 100, overflowY: 'auto', maxHeight: 'calc(5 * 52px)',
            }}>
              {slugSuggestions.map((t, i) => (
                <div
                  key={t.id}
                  onMouseDown={e => { e.preventDefault(); completeSugg(t); }}
                  style={{
                    padding: '7px 12px', cursor: 'pointer',
                    background: i === slugIdx ? 'var(--paper-3)' : 'transparent',
                    display: 'flex', flexDirection: 'column', gap: 1,
                    borderBottom: i < slugSuggestions.length - 1 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{t.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'monospace' }}>{t.id}</span>
                </div>
              ))}
            </div>
          )}

          <MarkdownEditor
            ref={editorRef}
            initialValue=""
            onChange={md => { setText(md); }}
            onSlugQuery={query => { setSlugQuery(query); if (query !== null) setSlugIdx(0); }}
            onKeyDown={handleKey}
            placeholder="Add a note… @name for follow-ups · [[YYYY-MM-DD]] due date · [[thread-slug]] to link"
            minHeight={72}
            autoFocus
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                {text.trim()
                  ? detectedType === 'FOLLOWUP'
                    ? <><span style={{ color: 'var(--accent)' }}>follow-up</span>{parseEntry(text).who && <> · <span style={{ color: 'var(--accent)' }}>@{parseEntry(text).who}</span></>}{parseEntry(text).due && <> · <span style={{ fontFamily: 'monospace' }}>{parseEntry(text).due}</span></>}</>
                    : detectedType === 'DECISION'
                    ? <span style={{ color: 'var(--ink-soft)' }}>decision</span>
                    : <span>note</span>
                  : <span>enter for newline · ⌘↵ to post</span>
                }
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                style={{
                  fontSize: 11, padding: '2px 8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: forceDecision ? 'var(--accent)' : 'var(--ink-faint)',
                  fontFamily: 'inherit',
                }}
                onClick={() => setForceDecision(d => !d)}
                title="Mark as decision"
              >
                decision
              </button>
              <button
                style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: text.trim() ? 'var(--ink)' : 'var(--paper-3)',
                  color: text.trim() ? 'var(--paper)' : 'var(--ink-faint)',
                  border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onClick={handleSubmit}
                disabled={!text.trim()}
                title="Post (⌘↵)"
              >
                <IconArrowUp size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {thread.blocks.length === 0 && (
            <div style={{ padding: '24px 0', color: 'var(--ink-faint)', fontSize: 13 }}>
              Nothing here yet — start writing above.
            </div>
          )}
          {dateGroups.map(group => (
            <div key={group.date}>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.06em', marginBottom: 6, paddingLeft: 2 }}>
                {group.date}
              </div>
              <div style={{ background: 'var(--paper-2)', borderRadius: 12, padding: '2px 4px' }}>
                {group.blocks.map((b, i) => (
                  <div key={b.id || i}>
                    {i > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '0 8px' }} />}
                    <FeedEntry
                      b={b}
                      onToggle={b.type === 'FOLLOWUP' ? () => cycleFollowupState(b.id, b.state) : null}
                      onEdit={text => updateBlock(thread.id, b.id, { text })}
                      isEditing={editingBlockId === b.id}
                      onStartEdit={() => setEditingBlockId(b.id)}
                      onStopEdit={() => setEditingBlockId(null)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="font-mono"
          style={{ marginTop: 28, fontSize: 11, color: 'var(--ink-faint)' }}
        >
          {thread.filename} · {thread.blocks.length} entries
        </div>
      </div>

      {/* ── Right rail ── */}
      <aside style={{ borderLeft: '1px solid var(--line)', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
        <section>
          <div className="kicker" style={{ marginBottom: 6 }}>Open follow-ups</div>
          {openFUs.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>None open.</div>}
          {openFUs.map((fu, i) => (
            <FollowupLine key={fu.id || i} fu={fu} compact onToggle={() => cycleFollowupState(fu.id, fu.state)} />
          ))}
        </section>

        {people.length > 0 && (
          <section>
            <div className="kicker" style={{ marginBottom: 6 }}>People</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {people.map(p => {
                const owed = thread.blocks.filter(b => b.type === 'FOLLOWUP' && b.who === p && b.state === 'open').length;
                const waiting = thread.blocks.filter(b => b.type === 'FOLLOWUP' && b.who === p && b.state === 'waiting').length;
                return (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                    <Person name={p} />
                    <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                      {owed > 0 && `${owed} open`}{waiting > 0 && ` · ${waiting} waiting`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="kicker" style={{ marginBottom: 6 }}>Meta</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['kind', thread.kind],
              ['status', thread.status],
              ['created', thread.created ? thread.created.slice(0, 10) : '—'],
              ['entries', thread.blocks.length],
              ['file', thread.filename],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--ink-soft)' }}>{k}</span>
                <span className="font-mono" style={{ color: 'var(--ink-2)', fontSize: 10.5 }}>{v}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="kicker" style={{ marginBottom: 6 }}>Backlinks</div>
          {backlinks.length === 0 ? (
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
              No threads link here yet.<br />
              <span style={{ fontSize: 10.5 }}>Use [[{thread.id}]] in any block.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {backlinks.map(t => (
                <button
                  key={t.id}
                  onClick={() => openThread(t.id)}
                  style={{
                    textAlign: 'left', padding: '4px 6px', borderRadius: 4,
                    background: 'transparent', border: '1px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                    color: 'var(--accent)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--paper-2)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  ← {t.title}
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>
    </main>
  );
}

function FeedEntry({ b, onToggle, onEdit, isEditing, onStartEdit, onStopEdit }) {
  const { threads } = useApp();
  const [editText, setEditText] = useState('');
  const [hovered, setHovered] = useState(false);
  const editEditorRef = useRef(null);
  const cancelRef = useRef(false);

  const [slugQuery, setSlugQuery] = useState(null);
  const [slugIdx, setSlugIdx] = useState(0);

  const slugSuggestions = useMemo(() => {
    if (slugQuery === null) return [];
    const q = slugQuery.toLowerCase();
    return threads
      .filter(t => q === '' || t.title.toLowerCase().includes(q) || t.id.includes(q))
      .slice(0, 8);
  }, [slugQuery, threads]);

  // When isEditing turns on: seed editText. When it turns off: save unless cancelled.
  useEffect(() => {
    if (isEditing) {
      setEditText(b.text);
      cancelRef.current = false;
      setSlugQuery(null);
      return;
    }
    if (!cancelRef.current) {
      const trimmed = editText.trim();
      if (trimmed && trimmed !== b.text) onEdit(trimmed);
    }
    cancelRef.current = false;
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  function completeEditSugg(t) {
    editEditorRef.current?.insertSlugCompletion(t.id);
    setSlugQuery(null);
  }

  function handleEditKey(e) {
    if (slugSuggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlugIdx(i => Math.min(i + 1, slugSuggestions.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlugIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); completeEditSugg(slugSuggestions[slugIdx]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setSlugQuery(null); return; }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onStopEdit(); return; }
    if (e.key === 'Escape') { e.preventDefault(); cancelRef.current = true; onStopEdit(); }
  }

  const editArea = (
    <div style={{ position: 'relative' }}>
      {slugSuggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2,
          background: 'var(--paper-2)', border: '1px solid var(--line)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 100, overflowY: 'auto', maxHeight: 'calc(5 * 52px)',
        }}>
          {slugSuggestions.map((t, i) => (
            <div
              key={t.id}
              onMouseDown={e => { e.preventDefault(); completeEditSugg(t); }}
              style={{
                padding: '7px 12px', cursor: 'pointer',
                background: i === slugIdx ? 'var(--paper-3)' : 'transparent',
                display: 'flex', flexDirection: 'column', gap: 1,
                borderBottom: i < slugSuggestions.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{t.title}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'monospace' }}>{t.id}</span>
            </div>
          ))}
        </div>
      )}
      <MarkdownEditor
        key={b.id}
        ref={editEditorRef}
        initialValue={b.text}
        onChange={md => setEditText(md)}
        onSlugQuery={query => { setSlugQuery(query); if (query !== null) setSlugIdx(0); }}
        onKeyDown={handleEditKey}
        minHeight={28}
        autoFocus
      />
      <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 4 }}>
        ⌘↵ to save · esc to cancel
      </div>
    </div>
  );

  if (b.type === 'FOLLOWUP') {
    const closed = b.state === 'closed' || b.state === 'checked';
    return (
      <div
        style={{ display: 'flex', gap: 10, padding: '7px 10px', marginBottom: 2, borderRadius: 8, background: hovered ? 'var(--paper-3)' : 'transparent', transition: 'background 0.1s' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ paddingTop: 3, flexShrink: 0 }}>
          <span
            className={`sk-check ${b.state === 'waiting' ? 'waiting' : b.state === 'checked' || b.state === 'closed' ? 'done' : ''}`}
            onClick={onToggle}
            style={{ cursor: 'pointer' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? editArea : (
            <div onClick={() => onStartEdit()} style={{ cursor: onEdit ? 'text' : 'default' }}>
              <RichText
                text={b.text}
                style={{
                  fontSize: 14, lineHeight: 1.5,
                  textDecoration: closed ? 'line-through' : 'none',
                  color: closed ? 'var(--ink-soft)' : 'var(--ink)',
                }}
              />
            </div>
          )}
          {(b.who || b.due) && !isEditing && (
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              {b.who && <Person name={b.who} />}
              {b.due && (
                <span className="chip chip-ghost" style={{ fontSize: 11 }}>
                  <IconClock size={10} style={{ marginRight: 2 }} />{b.due}
                </span>
              )}
              <span className={`chip chip-${b.state === 'waiting' ? 'waiting' : b.state === 'checked' || b.state === 'closed' ? 'done' : ''}`} style={{ fontSize: 10.5 }}>
                {b.state}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (b.type === 'DECISION') {
    return (
      <div
        style={{
          borderLeft: '2px solid var(--accent)',
          padding: '6px 0 6px 12px', marginBottom: 2,
          display: 'flex', gap: 6,
          borderRadius: '0 8px 8px 0',
          background: hovered ? 'var(--paper-3)' : 'transparent', transition: 'background 0.1s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', marginBottom: 3, textTransform: 'uppercase' }}>decided</div>
          {isEditing ? editArea : (
            <div onClick={() => onStartEdit()} style={{ cursor: onEdit ? 'text' : 'default' }}>
              <RichText text={b.text} style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // NOTE
  return (
    <div
      style={{ padding: '7px 10px', marginBottom: 2, borderRadius: 8, display: 'flex', gap: 6, alignItems: 'flex-start', background: hovered ? 'var(--paper-3)' : 'transparent', transition: 'background 0.1s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? editArea : (
          <div onClick={() => onStartEdit()} style={{ cursor: onEdit ? 'text' : 'default' }}>
            <RichText text={b.text} style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
