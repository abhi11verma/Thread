import { useState } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { computeStreak } from '../lib/markdown.js';
import { today } from '../lib/utils.js';
import { IconPin, IconPlus, IconChevLeft } from './atoms/Icons.jsx';
import AddRitualModal from './AddRitualModal.jsx';

export default function RitualsView() {
  const { rituals, streaks, doneDates, toggleRitual, toggleRitualPin } = useApp();
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // Keep selected in sync if rituals update (e.g. after pin toggle)
  const selectedRitual = selected ? rituals.find(r => r.id === selected) : null;

  if (selectedRitual) {
    return (
      <RitualDetail
        ritual={selectedRitual}
        streaks={streaks}
        doneDates={doneDates}
        onToggle={() => toggleRitual(selectedRitual.id)}
        onTogglePin={() => toggleRitualPin(selectedRitual.id)}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '22px 28px 40px', background: 'var(--paper)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div className="kicker" style={{ marginBottom: 4 }}>daily habits · streak tracking</div>
          <h1 className="font-sketch" style={{ margin: 0, fontWeight: 400, fontSize: 28 }}>Rituals</h1>
        </div>
        <button
          className="btn btn-soft"
          style={{ gap: 6, marginTop: 4 }}
          onClick={() => setShowAdd(true)}
        >
          <IconPlus size={13} /> Add ritual
        </button>
      </div>

      {rituals.length === 0 ? (
        <div style={{ marginTop: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>
          <div style={{ fontSize: 15, marginBottom: 8 }}>No rituals yet.</div>
          <div style={{ fontSize: 13 }}>Add your first daily habit to start tracking streaks.</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {rituals.map(r => (
            <RitualCard
              key={r.id}
              ritual={r}
              streaks={streaks}
              doneDates={doneDates}
              onOpen={() => setSelected(r.id)}
              onToggle={e => { e.stopPropagation(); toggleRitual(r.id); }}
              onTogglePin={e => { e.stopPropagation(); toggleRitualPin(r.id); }}
            />
          ))}
        </div>
      )}

      {showAdd && <AddRitualModal onClose={() => setShowAdd(false)} />}
    </main>
  );
}

function RitualCard({ ritual, streaks, doneDates, onOpen, onToggle, onTogglePin }) {
  const t = today();
  const done = doneDates[ritual.id]?.has(t);
  const streak = computeStreak(streaks[ritual.id] || []);
  const totalDone = (streaks[ritual.id] || []).length;

  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--paper-2)',
        border: `1.25px solid ${ritual.pinned ? 'var(--ink)' : 'var(--line-strong)'}`,
        borderRadius: 10,
        padding: '14px 14px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'border-color 0.15s',
        position: 'relative',
      }}
    >
      {/* Pin button */}
      <button
        onClick={onTogglePin}
        title={ritual.pinned ? 'Unpin from The Daily' : 'Pin to The Daily'}
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 2,
          color: ritual.pinned ? 'var(--ink)' : 'var(--ink-faint)',
          display: 'flex', alignItems: 'center',
        }}
      >
        <IconPin size={13} />
      </button>

      {/* Title */}
      <div style={{ paddingRight: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{ritual.label}</div>
        {ritual.detail && (
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 3 }}>{ritual.detail}</div>
        )}
      </div>

      {/* Mini heatmap — last 14 days */}
      <MiniHeatmap doneDates={doneDates} ritualId={ritual.id} days={14} />

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className={`sk-check ${done ? 'done' : ''}`}
            style={{ width: 13, height: 13, flexShrink: 0, cursor: 'pointer' }}
            onClick={onToggle}
          />
          <span style={{ fontSize: 11.5, color: done ? 'var(--ink-soft)' : 'var(--ink)', textDecoration: done ? 'line-through' : 'none' }}>
            Today
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {streak > 0 && (
            <span className="font-hand" style={{ fontSize: 12, color: streak >= 14 ? 'var(--accent)' : 'var(--ink-soft)' }}>
              {streak}d
            </span>
          )}
          {totalDone > 0 && (
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
              {totalDone}×
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniHeatmap({ doneDates, ritualId, days }) {
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    cells.push({ dateStr, done: doneDates[ritualId]?.has(dateStr) });
  }
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {cells.map(({ dateStr, done }) => (
        <div
          key={dateStr}
          title={dateStr}
          style={{
            flex: 1, height: 6, borderRadius: 2,
            background: done ? 'var(--accent)' : 'var(--line)',
          }}
        />
      ))}
    </div>
  );
}

function RitualDetail({ ritual, streaks, doneDates, onToggle, onTogglePin, onBack }) {
  const t = today();
  const done = doneDates[ritual.id]?.has(t);
  const streak = computeStreak(streaks[ritual.id] || []);
  const totalDone = (streaks[ritual.id] || []).length;

  // Last 30 days grid
  const days30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days30.push({ dateStr, done: doneDates[ritual.id]?.has(dateStr), isToday: i === 0 });
  }

  return (
    <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '22px 28px 40px', background: 'var(--paper)' }}>
      {/* Back */}
      <button
        className="btn btn-ghost"
        style={{ gap: 5, padding: '4px 6px', marginBottom: 20, fontSize: 12, color: 'var(--ink-soft)' }}
        onClick={onBack}
      >
        <IconChevLeft size={13} /> All rituals
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 className="font-sketch" style={{ margin: 0, fontWeight: 400, fontSize: 28 }}>{ritual.label}</h1>
        <button
          onClick={onTogglePin}
          title={ritual.pinned ? 'Unpin from The Daily' : 'Pin to The Daily'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: ritual.pinned ? 'var(--paper-2)' : 'transparent',
            border: `1px solid ${ritual.pinned ? 'var(--ink)' : 'var(--line-strong)'}`,
            borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
            fontSize: 12, color: ritual.pinned ? 'var(--ink)' : 'var(--ink-soft)',
          }}
        >
          <IconPin size={12} />
          {ritual.pinned ? 'Pinned to Daily' : 'Pin to Daily'}
        </button>
      </div>

      {ritual.detail && (
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>{ritual.detail}</div>
      )}

      {/* Today toggle */}
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '10px 16px',
          border: `1.25px solid ${done ? 'var(--ink)' : 'var(--line-strong)'}`,
          borderRadius: 8, cursor: 'pointer', marginBottom: 28,
          background: done ? 'var(--paper-2)' : 'transparent',
        }}
        onClick={onToggle}
      >
        <span className={`sk-check ${done ? 'done' : ''}`} style={{ width: 14, height: 14 }} />
        <span style={{ fontSize: 14, color: done ? 'var(--ink-soft)' : 'var(--ink)', textDecoration: done ? 'line-through' : 'none' }}>
          {done ? 'Done today' : 'Mark done today'}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
        <Stat label="Current streak" value={streak > 0 ? `${streak}d` : '—'} accent={streak >= 14} />
        <Stat label="Total completions" value={totalDone || '0'} />
        <Stat label="This month" value={days30.filter(d => d.done).length} />
      </div>

      {/* 30-day heatmap */}
      <div className="kicker" style={{ marginBottom: 8 }}>Last 30 days</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 380 }}>
        {days30.map(({ dateStr, done, isToday }) => (
          <div
            key={dateStr}
            title={dateStr}
            style={{
              width: 16, height: 16, borderRadius: 3,
              background: done ? 'var(--accent)' : 'var(--line)',
              outline: isToday ? '2px solid var(--ink)' : 'none',
              outlineOffset: 1,
            }}
          />
        ))}
      </div>
    </main>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div className="kicker">{label}</div>
      <div className="font-hand" style={{ fontSize: 26, color: accent ? 'var(--accent)' : 'var(--ink)', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
