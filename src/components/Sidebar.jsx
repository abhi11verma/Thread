import { useState, useRef } from 'react';
import { useApp } from '../store/AppContext.jsx';
import {
  IconSpark, IconInbox, IconThread, IconCheck, IconPeople,
  IconCal, IconArchive, IconPlus, IconSun, IconMoon, IconUpdate, IconNote,
  IconFolder, IconX, IconGear, IconRepeat,
} from './atoms/Icons.jsx';
import { Tag } from './atoms/Chips.jsx';
import { today } from '../lib/utils.js';
import { computeStreak } from '../lib/markdown.js';
import {
  getBuiltinThemes, getCustomThemes, getAllThemes,
  saveCustomTheme, removeCustomTheme, findTheme, validateTheme,
} from '../lib/theme.js';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', Icon: IconSpark },
  { key: 'today',     label: 'Today',       Icon: IconInbox },
  { key: 'threads',   label: 'All threads', Icon: IconThread },
  { key: 'fu',        label: 'Follow-ups',  Icon: IconCheck },
  { key: 'people',    label: 'People',      Icon: IconPeople },
  { key: 'scratch',   label: 'Scratch',     Icon: IconNote },
  { key: 'cal',       label: 'Calendar',    Icon: IconCal },
  { key: 'arch',      label: 'Archive',     Icon: IconArchive },
  { key: 'rituals',   label: 'Rituals',     Icon: IconRepeat },
];

function themePreview(t) {
  const flat = {};
  if (t.tokens) {
    for (const group of Object.values(t.tokens)) {
      if (group && typeof group === 'object') Object.assign(flat, group);
    }
  }
  return {
    bg:     flat['paper']  ?? '#fff',
    accent: flat['accent'] ?? '#000',
    ink:    flat['ink']    ?? '#000',
  };
}

export default function Sidebar({ themeKey, setThemeKey, onNewThread, onAddRitual }) {
  const { section, activeThreadId, threads, scratches, rituals, streaks, doneDates, setSection, openThread, getAllFollowups, rescanDirectory, pickDirectory, dirHandle, loading } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [customThemes, setCustomThemes] = useState(() => getCustomThemes());
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const allTags = [...new Set(threads.flatMap(t => t.tags))];
  const pinnedThreads = threads.filter(t => t.status === 'active').slice(0, 6);
  const t0 = today();

  const builtinThemes = getBuiltinThemes();
  const allThemes = [...builtinThemes, ...customThemes];

  function countFor(key) {
    if (key === 'today') return getAllFollowups().filter(f => f.due === t0 || f.due === 'today').length || null;
    if (key === 'threads') return threads.length || null;
    if (key === 'fu') return getAllFollowups().filter(f => f.state === 'open' || f.state === 'waiting').length || null;
    if (key === 'scratch') return scratches.filter(s => s.threadId === 'unassigned').length || null;
    return null;
  }

  function handleThemeUpload(e) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const err = validateTheme(parsed);
        if (err) { setUploadError(err); return; }

        // Prevent overwriting built-in theme keys
        const builtinKeys = new Set(builtinThemes.map(t => t.key));
        if (builtinKeys.has(parsed.key)) {
          parsed.key = `${parsed.key}-custom`;
        }

        saveCustomTheme(parsed);
        const updated = getCustomThemes();
        setCustomThemes(updated);
        setUploadError('');
        setThemeKey(parsed.key);
      } catch {
        setUploadError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  function handleRemoveCustomTheme(key) {
    removeCustomTheme(key);
    setCustomThemes(getCustomThemes());
    if (themeKey === key) setThemeKey('warm');
  }

  return (
    <>
    <aside
      style={{
        width: 272,
        borderRight: '1px solid var(--line)',
        background: 'var(--paper-2)',
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minHeight: 0,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 6px' }}>
        <div className="font-display" style={{ fontSize: 17, letterSpacing: -0.3 }}>
          Thread <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginLeft: 4, fontWeight: 400, letterSpacing: '0.1em' }}>v1</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }} />
      </div>

      {/* New thread */}
      <button
        className="btn btn-primary"
        style={{ justifyContent: 'center', width: '100%' }}
        onClick={onNewThread}
      >
        <IconPlus size={13} /> New thread <span className="kbd" style={{ borderColor: '#555', background: '#222', color: '#ddd' }}>N</span>
      </button>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ key, label, Icon }) => {
          const active = section === key && !(section === 'threads' && activeThreadId);
          const count = countFor(key);
          return (
            <button
              key={key}
              onClick={() => setSection(key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 8px', borderRadius: 6,
                background: active ? 'var(--paper)' : 'transparent',
                border: active ? '1px solid var(--line-strong)' : '1px solid transparent',
                cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} /> <span style={{ fontSize: 13 }}>{label}</span>
              </div>
              {count != null && (
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Pinned threads */}
      {pinnedThreads.length > 0 && (
        <>
          <div className="kicker" style={{ padding: '0 4px', marginTop: 2 }}>Threads — active</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pinnedThreads.map(t => {
              const isActive = section === 'thread' && t.id === activeThreadId;
              const openCount = t.blocks.filter(b => b.type === 'FOLLOWUP' && (b.state === 'open' || b.state === 'waiting')).length;
              const waitingCount = t.blocks.filter(b => b.type === 'FOLLOWUP' && b.state === 'waiting').length;
              return (
                <button
                  key={t.id}
                  onClick={() => openThread(t.id)}
                  style={{
                    textAlign: 'left',
                    padding: '9px 11px',
                    border: isActive ? '1px solid var(--line-strong)' : '1px solid var(--line)',
                    background: isActive ? 'var(--paper)' : 'var(--paper-3)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{
                      fontSize: 13.5, fontWeight: 500,
                      color: 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {t.title}
                    </span>
                    {openCount > 0 && (
                      <span style={{
                        fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace',
                        color: waitingCount > 0 ? 'var(--warn)' : 'var(--ink-soft)',
                        flexShrink: 0,
                      }}>
                        {openCount}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-soft)' }}>
                    {openCount === 0 ? 'no open loops' : `${openCount} open${waitingCount > 0 ? ` · ${waitingCount} waiting` : ''}`}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <>
          <div className="kicker" style={{ padding: '0 8px' }}>Tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 6px' }}>
            {allTags.map(t => <Tag key={t} t={t} />)}
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* The Daily — persistent sidebar strip */}
      <TheDailySidebar rituals={rituals} streaks={streaks} doneDates={doneDates} onAdd={onAddRitual} />

      {/* Settings */}
      <button
        className="btn btn-ghost"
        style={{ justifyContent: 'flex-start', gap: 8, padding: '5px 8px', fontSize: 12, color: showSettings ? 'var(--ink)' : 'var(--ink-soft)' }}
        onClick={() => setShowSettings(s => !s)}
        title="Settings"
      >
        <IconGear size={14} /> Settings
      </button>
    </aside>

    {/* Settings modal — centered overlay */}
    {showSettings && (
      <div
        onClick={() => setShowSettings(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 640, maxWidth: '90vw', maxHeight: '80vh',
            background: 'var(--paper-2)',
            border: '1px solid var(--line-strong)',
            borderRadius: 10,
            boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* Left nav */}
          <div style={{
            width: 180, flexShrink: 0,
            borderRight: '1px solid var(--line)',
            padding: '20px 10px',
            background: 'var(--paper)',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <div className="kicker" style={{ padding: '0 8px', marginBottom: 8 }}>Options</div>
            <button
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', gap: 8, padding: '6px 10px', fontSize: 13, background: 'var(--paper-2)', border: '1px solid var(--line)' }}
            >
              <IconGear size={14} /> General
            </button>
          </div>

          {/* Right content */}
          <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>General</h2>
              <button className="btn btn-ghost" style={{ padding: '4px 6px' }} onClick={() => setShowSettings(false)}>
                <IconX size={15} />
              </button>
            </div>

            {/* Appearance */}
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>Appearance</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 12 }}>
                Choose a colour tone for the interface.
              </div>

              {/* Built-in themes */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {allThemes.map(t => {
                  const { bg, accent, ink } = themePreview(t);
                  const isActive = themeKey === t.key;
                  const isCustom = !builtinThemes.find(b => b.key === t.key);
                  return (
                    <div key={t.key} style={{ position: 'relative' }}>
                      <button
                        onClick={() => setThemeKey(t.key)}
                        title={t.meta?.description || t.label}
                        style={{
                          width: 72,
                          border: isActive ? `2px solid var(--ink)` : `1.5px solid var(--line-strong)`,
                          borderRadius: 8,
                          padding: 0,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          background: 'transparent',
                          outline: 'none',
                        }}
                      >
                        <div style={{
                          height: 44,
                          background: bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                        }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: accent, display: 'inline-block' }} />
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: ink, letterSpacing: '0.06em' }}>Aa</span>
                        </div>
                        <div style={{
                          padding: '5px 0',
                          fontSize: 11,
                          fontFamily: 'JetBrains Mono, monospace',
                          letterSpacing: '0.08em',
                          color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                          background: 'var(--paper)',
                          textAlign: 'center',
                          fontWeight: isActive ? 500 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {t.label}
                        </div>
                      </button>
                      {isCustom && (
                        <button
                          onClick={() => handleRemoveCustomTheme(t.key)}
                          title="Remove theme"
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            width: 16, height: 16,
                            borderRadius: '50%',
                            background: 'var(--ink)',
                            color: 'var(--paper)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, lineHeight: 1,
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Upload custom theme */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <label
                  style={{ cursor: 'pointer' }}
                  title="Upload a theme JSON file"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={handleThemeUpload}
                  />
                  <span className="btn btn-soft" style={{ fontSize: 12, pointerEvents: 'none' }}>
                    + Upload theme
                  </span>
                </label>
                {uploadError && (
                  <span style={{ fontSize: 11, color: 'var(--warn)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {uploadError}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.5 }}>
                Theme files are JSON with <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>key</code>, <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>label</code>, and <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>tokens</code> fields.
                Any built-in theme file can be used as a starting point.
              </div>
            </div>

            {/* Data folder section */}
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>Data folder</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    The folder where your threads and notes are stored on disk.
                  </div>
                </div>
                <button
                  className="btn btn-soft"
                  style={{ fontSize: 12, gap: 6, flexShrink: 0 }}
                  onClick={pickDirectory}
                >
                  <IconFolder size={12} /> Change folder
                </button>
              </div>

              <div style={{
                marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 5,
                background: 'var(--paper)', border: '1px solid var(--line)',
                fontSize: 12, fontFamily: 'monospace', color: 'var(--ink-soft)',
              }}>
                <IconFolder size={12} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dirHandle?.name ?? 'No folder selected'}
                </span>
              </div>

              {dirHandle && (
                <div className="font-mono" style={{ marginTop: 8, paddingLeft: 2, lineHeight: 1.6, fontSize: 10.5, color: 'var(--ink-faint)' }}>
                  threads/<br />
                  ├─ {threads[0]?.filename || '—'}<br />
                  {threads.length > 1 && `└─ +${threads.length - 1} more`}
                </div>
              )}
            </div>

            {/* Rescan section */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>Refresh data</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  Re-read all files from the data folder to pick up external changes.
                </div>
              </div>
              <button
                className="btn btn-soft"
                style={{ fontSize: 12, gap: 6, flexShrink: 0 }}
                onClick={() => { rescanDirectory(); setShowSettings(false); }}
                disabled={loading || !dirHandle}
              >
                <IconUpdate size={12} style={loading ? { opacity: 0.4 } : {}} />
                {loading ? 'Loading…' : 'Rescan now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function TheDailySidebar({ rituals, streaks, doneDates, onAdd }) {
  const { toggleRitual } = useApp();
  const t = today();
  const pinned = rituals.filter(r => r.pinned);
  const displayed = pinned.length > 0 ? pinned : rituals;
  const doneCount = displayed.filter(r => doneDates[r.id]?.has(t)).length;

  return (
    <div
      style={{
        margin: '0 4px',
        padding: '10px 10px 8px',
        border: '1.25px solid var(--ink)',
        borderRadius: 8,
        background: 'var(--paper)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="font-sketch" style={{ fontSize: 13 }}>The Daily</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {displayed.length > 0 && (
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
              {doneCount}/{displayed.length}
            </span>
          )}
          <button
            onClick={onAdd}
            title="Add ritual"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--ink-soft)', padding: '0 2px', lineHeight: 1,
              fontSize: 15, display: 'flex', alignItems: 'center',
            }}
          >
            <IconPlus size={12} />
          </button>
        </div>
      </div>
      {displayed.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', padding: '2px 0 2px' }}>
          No rituals yet — add one to track your daily habits.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {displayed.map(r => {
            const done = doneDates[r.id]?.has(t);
            const streak = computeStreak(streaks[r.id] || []);
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  className={`sk-check ${done ? 'done' : ''}`}
                  style={{ width: 12, height: 12, flexShrink: 0, cursor: 'pointer' }}
                  onClick={() => toggleRitual(r.id)}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    color: done ? 'var(--ink-soft)' : 'var(--ink)',
                    textDecoration: done ? 'line-through' : 'none',
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {r.label}
                </span>
                {streak > 0 && (
                  <span className="font-hand" style={{ fontSize: 11, color: streak >= 14 ? 'var(--accent)' : 'var(--ink-soft)', flexShrink: 0 }}>
                    {streak}d
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
