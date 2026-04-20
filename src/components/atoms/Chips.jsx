import { IconClock } from './Icons.jsx';

export function Chip({ children, kind = '', style, onClick }) {
  return (
    <span className={`chip chip-${kind}`} style={style} onClick={onClick}>
      {children}
    </span>
  );
}

export function Tag({ t }) {
  return <span className="chip chip-tag">{t}</span>;
}

export function Person({ name }) {
  return <span className="chip chip-person">@{name}</span>;
}

export function Kbd({ children }) {
  return <span className="kbd">{children}</span>;
}

export function StateChip({ state }) {
  return (
    <span className={`chip chip-${state}`} style={{ textTransform: 'capitalize', fontSize: 10.5 }}>
      {state}
    </span>
  );
}

export function BlockTypePill({ type }) {
  const label = {
    NOTE: 'note', FOLLOWUP: 'follow-up', DECISION: 'decision',
    QUESTION: 'question', UPDATE: 'update',
  }[type] || type.toLowerCase();

  const kind = type === 'DECISION' ? 'decided'
    : type === 'FOLLOWUP' ? 'open'
    : 'ghost';

  return (
    <span
      className={`chip chip-${kind}`}
      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}
    >
      {label}
    </span>
  );
}

export function FollowupLine({ fu, compact, onToggle }) {
  const stateClass = { open: '', waiting: 'waiting', checked: 'done', closed: 'done' }[fu.state] || '';
  const closed = fu.state === 'closed' || fu.state === 'checked';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: compact ? '4px 0' : '6px 0',
      }}
    >
      <span
        className={`sk-check ${stateClass}`}
        onClick={onToggle}
        style={{ cursor: onToggle ? 'pointer' : 'default' }}
      />
      <span
        style={{
          flex: 1, fontSize: compact ? 12.5 : 13.5,
          textDecoration: closed ? 'line-through' : 'none',
          color: closed ? 'var(--ink-soft)' : 'var(--ink)',
          minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
        title={fu.text}
      >
        {fu.text}
      </span>
      {fu.who && <Person name={fu.who} />}
      {fu.due && (
        <span className="chip chip-ghost" style={{ fontSize: 11 }}>
          <IconClock size={10} style={{ marginRight: 2 }} /> {fu.due}
        </span>
      )}
      <StateChip state={fu.state} />
    </div>
  );
}
