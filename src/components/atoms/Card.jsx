import { Person, StateChip, Kbd } from './Chips.jsx';
import { IconClock, IconCheck } from './Icons.jsx';

export function Card({ children, warn }) {
  return (
    <section
      className="sk-card-soft"
      style={{
        padding: 14,
        borderColor: warn ? '#c7a35c' : undefined,
        background: warn ? 'var(--warn-soft)' : undefined,
      }}
    >
      {children}
    </section>
  );
}

export function CardHead({ title, kicker, right }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10, paddingBottom: 6, borderBottom: '1px dashed var(--line)',
      }}
    >
      <div>
        <div className="font-display" style={{ fontSize: 15, letterSpacing: -0.2 }}>{title}</div>
        {kicker && <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>{kicker}</div>}
      </div>
      {right}
    </div>
  );
}

export function DueSection({ label, tone, count, last, children }) {
  const warn = tone === 'warn';
  return (
    <div style={{ marginBottom: last ? 0 : 14 }}>
      <div
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          padding: '2px 0 4px',
          borderBottom: '1px solid var(--line)',
          marginBottom: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="font-sketch"
            style={{ fontSize: 13.5, letterSpacing: 0.2, color: warn ? 'var(--warn)' : 'var(--ink)' }}
          >
            {label}
          </span>
          {warn && <span className="chip chip-waiting" style={{ fontSize: 10 }}>needs nudge</span>}
        </div>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{count}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function DashFU({ fu, thread, pinged, stale, onOpen, onCheck }) {
  const stateClass = { open: '', waiting: 'waiting', checked: 'done', closed: 'done' }[fu.state] || '';
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 0', borderBottom: '1px dashed var(--line)',
      }}
    >
      <span className={`sk-check ${stateClass}`} onClick={onCheck} style={{ cursor: 'pointer' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13.5 }}>{fu.text}</span>
          {stale && <span className="chip chip-waiting" style={{ fontSize: 10 }}>stale</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <button
            onClick={onOpen}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--ink-soft)', fontSize: 11.5, textDecoration: 'underline dotted',
            }}
          >
            {thread}
          </button>
          {fu.who && <><span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>·</span><Person name={fu.who} /></>}
          {fu.due && (
            <span className="chip chip-ghost" style={{ fontSize: 11 }}>
              <IconClock size={10} /> {fu.due}
            </span>
          )}
          {pinged && <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>· {pinged}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn btn-soft" style={{ padding: '2px 7px', fontSize: 11 }} onClick={onCheck} title="Mark checked">
          <IconCheck size={11} />
        </button>
      </div>
    </div>
  );
}

export function Decision({ text, thread, when, onOpen }) {
  return (
    <div className="decision-block">
      <div style={{ fontSize: 13.5 }}>{text}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        {when && <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{when}</span>}
        {thread && (
          <button
            onClick={onOpen}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--ink-soft)', fontSize: 11.5, textDecoration: 'underline dotted',
            }}
          >
            {thread}
          </button>
        )}
      </div>
    </div>
  );
}
